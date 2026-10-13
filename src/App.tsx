import React, { useState, useMemo } from 'react';
import { Part, Vehicle, CartItem, Order, PartRequest } from './types';
import { SAMPLE_PARTS, INITIAL_ORDERS } from './data/mockData';
import { normalizePartNumber } from './utils/searchEngine';
import { VehicleSelector } from './components/VehicleSelector';
import { PartCard } from './components/PartCard';
import { PartModal } from './components/PartModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { PartRequestModal } from './components/PartRequestModal';
import { 
  ArrowRight, ShoppingBag, Globe, LayoutDashboard, 
  Store, HelpCircle, CheckCircle2, ChevronRight, Download
} from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [view, setView] = useState<'store' | 'admin'>('store');
  
  // State
  const [parts, setParts] = useState<Part[]>(SAMPLE_PARTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>({
    make: 'Toyota',
    model: 'Camry',
    year: 2022
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals & Active Part
  const [activePart, setActivePart] = useState<Part | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([
    { part: SAMPLE_PARTS[0], quantity: 1 }
  ]);

  const categories = ['All', 'Brakes', 'Engine', 'Filters', 'Suspension', 'Cooling', 'Electrical'];

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

  // Filter and Normalized Search logic
  const filteredParts = useMemo(() => {
    const normQuery = normalizePartNumber(searchQuery);

    return parts.filter(part => {
      if (selectedCategory !== 'All' && part.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const normOem = normalizePartNumber(part.oemNumber);
        const normSku = normalizePartNumber(part.sku);
        const normAlternates = part.alternateNumbers.map(normalizePartNumber);

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
  }, [parts, searchQuery, selectedCategory]);

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas-mist)' }}>
      
      {/* Top Banner (App Download Banner style - 48px height, black surface) */}
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
          <span style={{ color: '#acb0aa' }}>• Saudi Genuine Parts & Express Courier Network</span>
          <span style={{ color: '#5433eb', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}>
            mada & Apple Pay active
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
            <span>{view === 'store' ? 'Operations Admin' : 'Storefront'}</span>
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

      {/* Main Header Container (White surface, pillow soft, max-width 1200px) */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-faint-border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Wordmark with Single Violet Accent Dot */}
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setView('store')}>
            <span style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.06em', color: '#000000' }}>
              autopart
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#5433eb', display: 'inline-block', marginLeft: '2px', marginBottom: '-8px' }}></span>
          </div>

          {/* Right Header Navigation Controls (Garage & Cart Pill) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <VehicleSelector
              currentVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              lang={lang}
            />

            <button
              onClick={() => setIsCheckoutOpen(true)}
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

      {/* VIEW: ADMIN OPERATIONS DASHBOARD */}
      {view === 'admin' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', flex: 1 }}>
          <AdminDashboard
            parts={parts}
            orders={orders}
            partRequests={partRequests}
            onAddPart={(p) => setParts(prev => [p, ...prev])}
            onUpdateOrderStatus={(ordId, status) => {
              setOrders(prev => prev.map(o => o.id === ordId ? { ...o, deliveryStatus: status } : o));
            }}
            lang={lang}
          />
        </main>
      ) : (
        /* VIEW: CUSTOMER STOREFRONT */
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px 80px 24px', flex: 1 }}>
          
          {/* Hero Discovery Section with 64px vertical rhythm */}
          <section style={{ textAlign: 'center', marginBottom: '56px' }}>
            
            {/* Active Vehicle Fitment Notice */}
            {selectedVehicle ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span className="pill-fit" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  <CheckCircle2 size={14} />
                  <span>
                    {lang === 'ar'
                      ? `مركبتك المختارة: ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                      : `Selected: ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  </span>
                </span>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{ background: 'transparent', border: 'none', color: '#787574', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {lang === 'ar' ? 'مسح' : 'Change'}
                </button>
              </div>
            ) : null}

            {/* Wordmark & Search Bar in Shop style */}
            <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.06em', color: '#000000', marginBottom: '24px' }}>
              {lang === 'ar' ? 'ابحث عن قطع سيارتك بدقة متناهية' : 'What are you fixing today?'}
            </h1>

            {/* Pillow-Soft Search Bar (9999px radius, white fill, 48px violet submit button) */}
            <div style={{ maxWidth: '640px', margin: '0 auto 28px auto', position: 'relative' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 4px 4px 24px',
                transition: 'border-color 0.2s ease'
              }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث برقم القطعة مثل OEM-12345 أو اسم القطعة...' : 'What are you shopping for today? (e.g. 04465-33471)'}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: '#000000',
                    letterSpacing: '-0.031em',
                    backgroundColor: 'transparent'
                  }}
                />

                {/* Circular Shop Violet Submit Button with White Arrow Glyph */}
                <button className="btn-violet-submit" title="Search">
                  <ArrowRight size={20} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Category Pills Row (9999px radius, white fill, hairline border) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shop-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  <span>{cat}</span>
                </button>
              ))}

              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="shop-pill"
                style={{ color: '#5433eb', borderColor: 'var(--color-violet-wash)' }}
              >
                <HelpCircle size={14} color="#5433eb" />
                <span>{lang === 'ar' ? 'طلب برقم الهيكل (VIN)' : 'Request via VIN'}</span>
              </button>
            </div>
          </section>

          {/* Section Header (20px GTStandard-MSemibold at -1.0px tracking) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.05em', color: '#000000' }}>
                {selectedCategory === 'All' ? (lang === 'ar' ? 'أبرز القطع المتوافقة' : 'Featured Genuine Parts') : `${selectedCategory} Parts`}
              </h2>
              <ChevronRight size={18} color="#000000" />
            </div>

            <span style={{ fontSize: '13px', color: '#787574', letterSpacing: '-0.017em' }}>
              {filteredParts.length} items available
            </span>
          </div>

          {/* Floating Constellation Product Card Grid (28px radius, 12px gaps) */}
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
            /* Empty Search State */
            <div className="shop-card" style={{ textAlign: 'center', padding: '64px 24px', margin: '20px 0' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.04em', color: '#000000', marginBottom: '8px' }}>
                {lang === 'ar' ? 'لم نجد نتائج مطابقة' : 'No exact parts match your query'}
              </h3>
              <p style={{ fontSize: '14px', color: '#787574', maxWidth: '440px', margin: '0 auto 24px auto' }}>
                We can source this directly from authorized Toyota, Nissan, or Hyundai distributors across KSA.
              </p>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="btn-shop-primary"
                style={{ padding: '12px 28px' }}
              >
                <span>Request part via VIN</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

        </main>
      )}

      {/* Footer (Dark band with columnar layout) */}
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
              Saudi automotive spare parts e-commerce with exact vehicle fitment engine.
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
          © 2026 AutoPart KSA Platform. Designed with Shop Style Reference Tokens.
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
