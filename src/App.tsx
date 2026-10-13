import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Part, Vehicle, CartItem, Order, PartRequest, VehicleMake, PartCategory, PartBrand, QualityGradeConfig } from './types';
import { SAMPLE_PARTS, INITIAL_ORDERS } from './data/mockData';
import { normalizePartNumber } from './utils/searchEngine';
import { VehicleSelector } from './components/VehicleSelector';
import { ManufacturerGrid } from './components/ManufacturerGrid';
import { CategoryGrid } from './components/CategoryGrid';
import { ManufacturerDetailPage } from './components/ManufacturerDetailPage';
import { PartCard } from './components/PartCard';
import { PartModal } from './components/PartModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { PartRequestModal } from './components/PartRequestModal';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { AccountPage } from './components/AccountPage';
import { useAuth } from './context/AuthContext';
import { 
  ArrowRight, ShoppingBag, Globe, LayoutDashboard, 
  Store, HelpCircle, CheckCircle2, ChevronRight, Download,
  User as UserIcon, LogIn, UserPlus, ChevronDown, Package, MapPin, LogOut,
  ShieldCheck, Car, Layers, RefreshCw, X, ArrowLeft
} from 'lucide-react';

export function App() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [view, setView] = useState<'store' | 'admin' | 'login' | 'signup' | 'account' | 'make-detail'>('store');
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  // Selected Entity Details
  const [activeMakeForDetail, setActiveMakeForDetail] = useState<VehicleMake | null>(null);

  // PostgreSQL Dynamic Catalog States
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [brands, setBrands] = useState<PartBrand[]>([]);
  const [qualityGrades, setQualityGrades] = useState<QualityGradeConfig[]>([]);
  const [parts, setParts] = useState<Part[]>(SAMPLE_PARTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Persistent Selected Vehicle in Garage
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(() => {
    const saved = localStorage.getItem('autopart_selected_vehicle');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      make: 'Toyota',
      model: 'Camry',
      year: 2022
    };
  });

  // Save selected vehicle to localStorage
  useEffect(() => {
    if (selectedVehicle) {
      localStorage.setItem('autopart_selected_vehicle', JSON.stringify(selectedVehicle));
    } else {
      localStorage.removeItem('autopart_selected_vehicle');
    }
  }, [selectedVehicle]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  
  // Modals & Active Part
  const [activePart, setActivePart] = useState<Part | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([
    { part: SAMPLE_PARTS[0], quantity: 1 }
  ]);

  // Fetch initial PostgreSQL published data
  const loadPublishedCatalogData = useCallback(async () => {
    try {
      setIsLoadingCatalog(true);
      const [makesRes, catsRes, brandsRes, gradesRes, prodsRes] = await Promise.all([
        fetch('/api/vehicles/makes').then(r => r.ok ? r.json() : []),
        fetch('/api/categories').then(r => r.ok ? r.json() : []),
        fetch('/api/brands').then(r => r.ok ? r.json() : []),
        fetch('/api/quality-grades').then(r => r.ok ? r.json() : []),
        fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }),
      ]);

      if (Array.isArray(makesRes) && makesRes.length > 0) setMakes(makesRes);
      if (Array.isArray(catsRes) && catsRes.length > 0) setCategories(catsRes);
      if (Array.isArray(brandsRes) && brandsRes.length > 0) setBrands(brandsRes);
      if (Array.isArray(gradesRes) && gradesRes.length > 0) setQualityGrades(gradesRes);

      if (prodsRes?.products && Array.isArray(prodsRes.products) && prodsRes.products.length > 0) {
        // Map backend product format to UI Part format
        const mappedParts: Part[] = prodsRes.products.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          mpn: p.mpn,
          oemNumber: p.oemNumber || p.sku,
          barcode: p.barcode,
          alternateNumbers: [p.sku, p.oemNumber].filter(Boolean),
          nameEn: p.nameEn,
          nameAr: p.nameAr || p.nameEn,
          shortDescriptionEn: p.shortDescriptionEn,
          shortDescriptionAr: p.shortDescriptionAr,
          category: p.categoryNameEn || 'General',
          categoryId: p.categoryId,
          categorySlug: p.categorySlug,
          brand: p.brandName || 'OEM Genuine',
          brandId: p.brandId,
          brandLogoUrl: p.brandLogoUrl,
          qualityGrade: p.qualityGrade || 'GRADE_A',
          gradeDisplayLabel: p.gradeDisplayLabel || 'Grade A',
          condition: p.condition || 'NEW',
          isOem: p.isOem ?? true,
          isOriginal: p.isOriginal ?? true,
          testedStatus: p.testedStatus,
          warrantyMonths: p.warrantyMonths,
          price: Number(p.salePrice || p.sellingPrice),
          originalPrice: p.salePrice ? Number(p.sellingPrice) : undefined,
          stock: p.stockQuantity || 0,
          warehouseLocation: p.warehouseLocation || 'Riyadh Central Hub',
          rating: 4.9,
          reviewCount: 38,
          images: p.images?.length ? p.images.map((im: any) => im.url || im) : [SAMPLE_PARTS[0].images[0]],
          descriptionEn: p.descriptionEn || p.shortDescriptionEn || '',
          descriptionAr: p.descriptionAr || p.shortDescriptionAr || '',
          installationPosition: p.installationPosition,
          specifications: p.technicalSpecs || {},
          fitments: p.fitments?.map((f: any) => ({
            make: f.makeName,
            model: f.modelName,
            years: f.yearNumber ? [f.yearNumber] : [2022],
            notes: f.fitmentNote
          })) || [],
          warranty: `${p.warrantyMonths || 12} Months Warranty`,
          deliveryDays: 'Same-day Riyadh / 24-48h all KSA',
          status: p.status
        }));
        setParts(mappedParts);
      }
    } catch (err) {
      console.error('Failed to load database catalog items, keeping fallback', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadPublishedCatalogData();
  }, [loadPublishedCatalogData]);

  // Add to Cart
  const handleAddToCart = (part: Part) => {
    setCart(prev => {
      const existing = prev.find(item => item.part.id === part.id);
      if (existing) {
        return prev.map(item => item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  // Order placed callback
  const handleOrderPlaced = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setParts(prev => prev.map(p => {
      const purchased = newOrder.items.find(it => it.part.id === p.id);
      if (purchased) {
        return { ...p, stock: Math.max(0, p.stock - purchased.quantity) };
      }
      return p;
    }));
    setCart([]);
  };

  // Filter and Verified Fitment search logic
  const filteredParts = useMemo(() => {
    const normQuery = normalizePartNumber(searchQuery);

    return parts.filter(part => {
      // 1. Category Filter
      if (selectedCategorySlug !== 'all') {
        const matchesCategory = 
          part.categorySlug === selectedCategorySlug ||
          part.category.toLowerCase().includes(selectedCategorySlug.toLowerCase()) ||
          selectedCategorySlug.toLowerCase().includes(part.category.toLowerCase());
        if (!matchesCategory) return false;
      }

      // 2. Quality Grade Filter
      if (selectedGradeFilter !== 'all' && part.qualityGrade !== selectedGradeFilter) {
        return false;
      }

      // 3. Verified Vehicle Fitment Filter:
      // When a customer has a selected vehicle in their garage, ONLY show products verified in DB!
      if (selectedVehicle) {
        const fitsVehicle = part.fitments.some(f => {
          const matchMake = f.make.toLowerCase() === selectedVehicle.make.toLowerCase();
          const matchModel = f.model.toLowerCase().includes(selectedVehicle.model.toLowerCase()) || 
                             selectedVehicle.model.toLowerCase().includes(f.model.toLowerCase());
          const matchYear = !selectedVehicle.year || f.years.length === 0 || f.years.includes(selectedVehicle.year);
          return matchMake && matchModel && matchYear;
        });

        if (!fitsVehicle) {
          return false;
        }
      }

      // 4. Search query (normalized part numbers, SKU, OEM, or text)
      if (searchQuery.trim()) {
        const normOem = normalizePartNumber(part.oemNumber);
        const normSku = normalizePartNumber(part.sku);
        const normAlternates = (part.alternateNumbers || []).map(normalizePartNumber);

        const matchPartNumber = 
          normOem.includes(normQuery) ||
          normSku.includes(normQuery) ||
          normAlternates.some(alt => alt.includes(normQuery));

        const matchText = 
          part.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.nameAr.includes(searchQuery) ||
          part.brand.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchPartNumber && !matchText) {
          return false;
        }
      }

      return true;
    });
  }, [parts, searchQuery, selectedCategorySlug, selectedGradeFilter, selectedVehicle]);

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Shopping Journey A: Select Make -> Open dedicated selection page
  const handleSelectMake = (make: VehicleMake) => {
    setActiveMakeForDetail(make);
    setView('make-detail');
  };

  // Shopping Journey B: Select Category from Visual Section
  const handleSelectCategoryFromGrid = (cat: PartCategory) => {
    setSelectedCategorySlug(cat.slug);
    // Smooth scroll down to products
    const el = document.getElementById('catalog-products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas-mist)' }}>
      
      {/* Top Banner (App Download Banner style - 44px height, black surface) */}
      <div style={{
        height: '44px',
        backgroundColor: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
          <span style={{ fontWeight: '600' }}>AutoPart KSA</span>
          <span style={{ color: '#acb0aa' }}>• Dynamic Vehicle-First Parts Catalog & Express Delivery</span>
          <span style={{ color: '#5433eb', fontWeight: '600', marginLeft: '6px' }}>
            mada & Apple Pay verified
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Switcher Pill */}
          <button
            onClick={() => setView(view === 'store' ? 'admin' : 'store')}
            style={{
              background: 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            {view === 'store' ? <LayoutDashboard size={12} /> : <Store size={12} />}
            <span>{view === 'store' ? 'Admin Dashboard' : 'Storefront'}</span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            <Globe size={12} />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-faint-border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setView('store')}>
            <span style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.06em', color: '#000000' }}>
              autopart
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#5433eb', display: 'inline-block', marginLeft: '2px', marginBottom: '-8px' }}></span>
          </div>

          {/* Right Header Navigation Controls (Garage Selector, Auth options & Cart Pill) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <VehicleSelector
              currentVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              lang={lang}
            />

            {/* Authentication Buttons / Account Menu */}
            {!user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  id="nav-signin-btn"
                  onClick={() => {
                    setIntendedDestination(null);
                    setView('login');
                  }}
                  className="shop-pill"
                  style={{
                    padding: '8px 16px',
                    height: '44px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogIn size={15} color="#000000" />
                  <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                </button>

                <button
                  id="nav-signup-btn"
                  onClick={() => {
                    setIntendedDestination(null);
                    setView('signup');
                  }}
                  style={{
                    padding: '8px 18px',
                    height: '44px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <UserPlus size={15} />
                  <span>{lang === 'ar' ? 'إنشاء حساب' : 'Sign Up'}</span>
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  id="nav-account-dropdown-btn"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="shop-pill"
                  style={{
                    padding: '8px 16px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    backgroundColor: '#5433eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} color="#787574" />
                </button>

                {/* Account Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: lang === 'en' ? 0 : 'auto',
                      left: lang === 'ar' ? 0 : 'auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: '1px solid var(--color-faint-border)',
                      padding: '8px',
                      minWidth: '220px',
                      zIndex: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setView('account');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#000000',
                        cursor: 'pointer',
                        textAlign: lang === 'ar' ? 'right' : 'left',
                        width: '100%'
                      }}
                    >
                      <Package size={16} color="#5433eb" />
                      <span>{lang === 'ar' ? 'طلباتي وفواتير ZATCA' : 'My Orders & Invoices'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setView('account');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#000000',
                        cursor: 'pointer',
                        textAlign: lang === 'ar' ? 'right' : 'left',
                        width: '100%'
                      }}
                    >
                      <MapPin size={16} color="#5433eb" />
                      <span>{lang === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}</span>
                    </button>

                    <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '4px 0' }} />

                    <button
                      id="account-menu-logout-btn"
                      onClick={async () => {
                        setIsAccountMenuOpen(false);
                        await logout();
                        setView('store');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#cf1322',
                        cursor: 'pointer',
                        textAlign: lang === 'ar' ? 'right' : 'left',
                        width: '100%'
                      }}
                    >
                      <LogOut size={16} />
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bag Button */}
            <button
              id="header-bag-btn"
              onClick={() => {
                if (!user) {
                  setIntendedDestination('checkout');
                  setView('login');
                } else {
                  setIsCheckoutOpen(true);
                }
              }}
              className="shop-pill"
              style={{ padding: '8px 18px', height: '44px' }}
            >
              <ShoppingBag size={16} color="#000000" />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{lang === 'ar' ? 'السلة' : 'Bag'}</span>
              {cartCount > 0 && (
                <span style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginLeft: '2px'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* VIEW: LOGIN PAGE */}
      {view === 'login' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', flex: 1 }}>
          <LoginPage
            lang={lang}
            guestCart={cart}
            intendedDestination={intendedDestination}
            onNavigateToSignUp={() => setView('signup')}
            onSuccess={() => {
              if (intendedDestination === 'checkout') {
                setView('store');
                setIsCheckoutOpen(true);
                setIntendedDestination(null);
              } else {
                setView('store');
              }
            }}
          />
        </main>
      ) : view === 'signup' ? (
        /* VIEW: SIGN UP PAGE */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', flex: 1 }}>
          <SignUpPage
            lang={lang}
            guestCart={cart}
            onNavigateToLogin={() => setView('login')}
            onSuccess={() => {
              if (intendedDestination === 'checkout') {
                setView('store');
                setIsCheckoutOpen(true);
                setIntendedDestination(null);
              } else {
                setView('store');
              }
            }}
          />
        </main>
      ) : view === 'account' ? (
        /* VIEW: ACCOUNT PAGE */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', flex: 1 }}>
          <AccountPage
            lang={lang}
            onLogout={() => setView('store')}
          />
        </main>
      ) : view === 'admin' ? (
        /* VIEW: ADMIN OPERATIONS DASHBOARD */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', flex: 1 }}>
          <AdminDashboard
            parts={parts}
            orders={orders}
            partRequests={partRequests}
            makes={makes}
            categories={categories}
            brands={brands}
            qualityGrades={qualityGrades}
            onAddPart={(p) => setParts(prev => [p, ...prev])}
            onUpdateOrderStatus={(ordId, status) => {
              setOrders(prev => prev.map(o => o.id === ordId ? { ...o, deliveryStatus: status } : o));
            }}
            onRefreshAllData={loadPublishedCatalogData}
            lang={lang}
          />
        </main>
      ) : view === 'make-detail' && activeMakeForDetail ? (
        /* VIEW: JOURNEY A: DEDICATED VEHICLE SELECTION PAGE */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px 80px', flex: 1 }}>
          <ManufacturerDetailPage
            make={activeMakeForDetail}
            onBack={() => setView('store')}
            onSelectVehicleAndBrowse={(v) => {
              setSelectedVehicle(v);
              setView('store');
              // Smooth scroll to catalog
              setTimeout(() => {
                const el = document.getElementById('catalog-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            lang={lang}
          />
        </main>
      ) : (
        /* VIEW: VEHICLE-FIRST CUSTOMER HOMEPAGE */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px 80px 24px', flex: 1 }}>
          
          {/* Active Garage Vehicle Banner */}
          {selectedVehicle && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '14px 20px',
              marginBottom: '32px',
              border: '1.5px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#000000' }}>
                    {lang === 'ar' ? 'السيارة المختارة حالياً: ' : 'Your Active Vehicle: '}
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.engine ? `(${selectedVehicle.engine})` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#0d8239', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} />
                    <span>{lang === 'ar' ? 'يتم عرض القطع المتوافقة والموثقة فقط' : 'Catalog filtered strictly for verified fitment'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="btn-shop-pill"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  {lang === 'ar' ? 'مسح الفلتر' : 'Clear Vehicle'}
                </button>
              </div>
            </div>
          )}

          {/* Section A: Vehicle Manufacturer Logos ("Shop Parts by Vehicle") */}
          <ManufacturerGrid
            makes={makes}
            selectedMakeId={makes.find(m => m.name.toLowerCase() === selectedVehicle?.make.toLowerCase())?.id}
            onSelectMake={handleSelectMake}
            lang={lang}
          />

          {/* Section B: Visual Part Categories ("Shop Parts by Category") */}
          <CategoryGrid
            categories={categories}
            selectedCategoryId={categories.find(c => c.slug === selectedCategorySlug)?.id}
            onSelectCategory={handleSelectCategoryFromGrid}
            lang={lang}
          />

          {/* Section C: Search Bar & Multi-Dimensional Catalog Filtering */}
          <section id="catalog-products-section" style={{ marginBottom: '32px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid var(--color-faint-border)',
              marginBottom: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              <div style={{ maxWidth: '680px', margin: '0 auto 20px auto' }}>
                <div style={{
                  backgroundColor: '#f5f5f7',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 6px 4px 20px'
                }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث باسم القطعة، رقم OEM، أو الرمز (مثال: 04465-33471)...' : 'Search by part name, OEM reference, MPN, or SKU (e.g. 04465-33471)...'}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: '#000000',
                      backgroundColor: 'transparent'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', color: '#787574' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button className="btn-violet-submit" title="Search">
                    <ArrowRight size={18} color="#ffffff" />
                  </button>
                </div>
              </div>

              {/* Category Pills & Quality Grade Filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedCategorySlug('all')}
                    className={`shop-pill ${selectedCategorySlug === 'all' ? 'active' : ''}`}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <span>{lang === 'ar' ? 'جميع الأقسام' : 'All Categories'}</span>
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategorySlug(c.slug)}
                      className={`shop-pill ${selectedCategorySlug === c.slug ? 'active' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <span>{lang === 'ar' ? c.nameAr : c.nameEn}</span>
                    </button>
                  ))}
                </div>

                {/* Quality Grade Filter Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#787574', fontWeight: '500' }}>
                    {lang === 'ar' ? 'درجة الجودة:' : 'Quality Tier:'}
                  </span>
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="shop-input"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '9999px' }}
                  >
                    <option value="all">{lang === 'ar' ? 'جميع الدرجات' : 'All Grades (A / B / C)'}</option>
                    <option value="GRADE_A">Grade A (Pristine / OEM Benchmark)</option>
                    <option value="GRADE_B">Grade B (Certified Tested)</option>
                    <option value="GRADE_C">Grade C (Budget Value)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catalog Products Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.03em', color: '#000000', margin: 0 }}>
                  {selectedVehicle 
                    ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} Compatible Parts`
                    : (selectedCategorySlug !== 'all' ? `${categories.find(c => c.slug === selectedCategorySlug)?.nameEn || 'Filtered'} Parts` : 'Verified Compatible Auto Parts')}
                </h3>
              </div>
              <span style={{ fontSize: '13px', color: '#787574' }}>
                {filteredParts.length} {lang === 'ar' ? 'قطع موثقة' : 'verified parts'}
              </span>
            </div>

            {/* Products Grid */}
            {filteredParts.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px'
              }}>
                {filteredParts.map(part => (
                  <PartCard
                    key={part.id}
                    part={part}
                    selectedVehicle={selectedVehicle}
                    onAddToCart={handleAddToCart}
                    onViewDetails={setActivePart}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              /* Verified Empty State */
              <div className="shop-card" style={{ textAlign: 'center', padding: '64px 24px', margin: '20px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f2f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Car size={28} color="#787574" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.03em', color: '#000000', marginBottom: '8px' }}>
                  {lang === 'ar' ? 'لا توجد قطع غيار مسجلة متوافقة حالياً' : 'No compatible parts found for this selection'}
                </h3>
                <p style={{ fontSize: '13px', color: '#787574', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                  {selectedVehicle 
                    ? `We only display components verified in our PostgreSQL database for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. You can request this item directly via VIN.`
                    : 'Try clearing your filters or search by part number / OEM code.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {selectedVehicle && (
                    <button
                      onClick={() => setSelectedVehicle(null)}
                      className="btn-shop-pill"
                      style={{ padding: '10px 20px', fontSize: '13px' }}
                    >
                      Clear Vehicle Filter
                    </button>
                  )}
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="btn-shop-primary"
                    style={{ padding: '10px 24px', fontSize: '13px' }}
                  >
                    <span>Request Part via VIN</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </section>

        </main>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: '#000000', color: '#ffffff', padding: '48px 24px 32px 24px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.06em', color: '#ffffff' }}>
                autopart
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#5433eb', display: 'inline-block', marginLeft: '2px', marginBottom: '-6px' }}></span>
            </div>
            <p style={{ fontSize: '13px', color: '#787574', maxWidth: '300px' }}>
              Saudi automotive spare parts e-commerce with verified vehicle fitment engine and database-driven administration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '48px', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>Payments</div>
              <div style={{ color: '#787574', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>mada Debit</span>
                <span>Apple Pay</span>
                <span>STC Pay</span>
                <span>Tamara BNPL</span>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>Delivery</div>
              <div style={{ color: '#787574', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>SMSA Express</span>
                <span>Aramex KSA</span>
                <span>Riyadh Central Hub</span>
                <span>Jeddah Coastal Hub</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '32px auto 0 auto', paddingTop: '20px', borderTop: '1px solid #222222', fontSize: '12px', color: '#787574', textAlign: 'center' }}>
          © 2026 AutoPart KSA Platform. Dynamic Vehicle Catalog & Admin Management.
        </div>
      </footer>

      {/* Modals */}
      <PartModal
        part={activePart}
        selectedVehicle={selectedVehicle}
        onClose={() => setActivePart(null)}
        onAddToCart={handleAddToCart}
        lang={lang}
      />

      <CheckoutModal
        cart={cart}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
        lang={lang}
      />

      <PartRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        selectedVehicle={selectedVehicle}
        onSubmit={(req) => setPartRequests(prev => [req, ...prev])}
        lang={lang}
      />
    </div>
  );
}

export default App;
