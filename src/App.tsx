import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeroCarousel } from './components/HeroCarousel';
import { Part, Vehicle, CartItem, Order, PartRequest, VehicleMake, PartCategory, PartBrand, QualityGradeConfig } from './types';
import { SAMPLE_PARTS, INITIAL_ORDERS, POPULAR_VEHICLES } from './data/mockData';
import { normalizePartNumber } from './utils/searchEngine';
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
  Search, ShoppingCart, Phone, MessageSquare, ChevronRight, ChevronLeft,
  Car, ShieldCheck, Truck, RefreshCw, Headphones, Check, ArrowRight,
  User as UserIcon, LogIn, UserPlus, LogOut, Package, MapPin, X, Flame, Sparkles
} from 'lucide-react';

export function App() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [view, setView] = useState<'store' | 'admin' | 'login' | 'signup' | 'account'>('store');
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  // Parts & Cart
  const [parts, setParts] = useState<Part[]>(SAMPLE_PARTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([
    { part: SAMPLE_PARTS[0], quantity: 1 }
  ]);
  const [activePart, setActivePart] = useState<Part | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);

  // Selected vehicle for fitment engine
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>({
    make: 'Toyota',
    model: 'Land Cruiser (LC300)',
    year: 2024
  });

  // Part finder form states
  const [finderMake, setFinderMake] = useState('Toyota');
  const [finderModel, setFinderModel] = useState('Land Cruiser (LC300)');
  const [finderYear, setFinderYear] = useState<number>(2024);
  const [finderVariant, setFinderVariant] = useState('3.5L Twin-Turbo V6 (V35A)');

  // Search & Trending Filter Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTab, setTrendingTab] = useState<'all' | 'brakes' | 'exhaust' | 'fluids' | 'ignition'>('all');

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.part.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (part: Part) => {
    setCart(prev => {
      const existing = prev.find(item => item.part.id === part.id);
      if (existing) {
        return prev.map(item => item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  const handleApplyFinder = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedVehicle({
      make: finderMake,
      model: finderModel,
      year: finderYear,
      engine: finderVariant
    });
    const el = document.getElementById('catalog-products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const trendingProducts = useMemo(() => {
    return parts.filter(p => {
      if (trendingTab === 'all') return true;
      if (trendingTab === 'brakes') return p.categorySlug === 'brakes';
      if (trendingTab === 'exhaust') return p.categorySlug === 'engine-parts';
      if (trendingTab === 'fluids') return p.categorySlug === 'fluids';
      if (trendingTab === 'ignition') return p.categorySlug === 'ignition';
      return true;
    }).slice(0, 4);
  }, [parts, trendingTab]);

  const wheelProducts = useMemo(() => {
    return parts.filter(p => p.categorySlug === 'wheels');
  }, [parts]);

  const filterProducts = useMemo(() => {
    return parts.filter(p => p.categorySlug === 'filters' || p.categorySlug === 'fluids').slice(0, 5);
  }, [parts]);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#EEEEEE' }}>

      {/* =========================================================================
          1. HEADER COMPONENT (Exact Match to Screenshot)
          ========================================================================= */}

      {/* Top Black Micro-utility Bar (matches autostore.sa top right links) */}
      <div style={{
        height: '28px',
        backgroundColor: '#0D0D0D',
        borderBottom: '1px solid #1A1A1A',
        color: '#888888',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 32px',
        gap: '20px',
        fontFamily: 'var(--font-ui)'
      }}>
        <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '11px' }}>
          Blog
        </button>
        <span style={{ color: '#333' }}>•</span>
        <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '11px' }}>
          About Us
        </button>
        <span style={{ color: '#333' }}>•</span>
        <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '11px' }}>
          Contact Us
        </button>
        <span style={{ color: '#333' }}>•</span>
        <button onClick={() => { if (!user) setView('login'); else setView('account'); }} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '11px' }}>
          {user ? user.name : 'My Account'}
        </button>
        <span style={{ color: '#333' }}>•</span>
        <button onClick={() => setView(view === 'store' ? 'admin' : 'store')} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '11px' }}>
          {view === 'store' ? 'Admin' : 'Store'}
        </button>
        <span style={{ color: '#333' }}>•</span>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ background: 'none', border: 'none', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '11px' }}>
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Main Header Bar (#1A1A1A Dark Surface) */}
      <div style={{
        backgroundColor: '#161616',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '32px',
        color: '#ffffff'
      }}>
        {/* Autoparts Logo (Matching Autostore.sa Hexagon/Shield Badge + Two-line Text) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
          onClick={() => setView('store')}
        >
          {/* Geometric Hexagon Icon */}
          <div style={{
            width: '42px',
            height: '42px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #E53935 0%, #D42B2B 100%)',
            borderRadius: '10px',
            boxShadow: '0 3px 10px rgba(229, 57, 53, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 8.5 2 15.5 12 22 22 15.5 22 8.5 12 2" />
              <circle cx="12" cy="12" r="3.5" fill="#ffffff" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: 900,
              fontFamily: 'var(--font-content)',
              letterSpacing: '0.8px',
              color: '#ffffff',
              lineHeight: '1.1'
            }}>
              AUTOPARTS<span style={{ color: '#E53935' }}>.sa</span>
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1.2px',
              color: 'rgba(255, 255, 255, 0.65)',
              textTransform: 'uppercase',
              marginTop: '2px'
            }}>
              NO.1 ONLINE AUTO STORE
            </span>
          </div>
        </div>

        {/* Clean White Search Bar with Search Icon inside placeholder */}
        <div style={{ flex: '1 1 580px', maxWidth: '640px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            padding: '0 14px',
            height: '42px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            <Search size={18} color="#777777" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts, accessories & more..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#222222',
                backgroundColor: 'transparent'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const el = document.getElementById('catalog-products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>

        {/* Right Section: Call Us + WhatsApp + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 }}>
          {/* Call Us Block with phone icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={22} color="#ffffff" style={{ strokeWidth: 1.8 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                CALL US
              </span>
              <a href="tel:03212111406" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', textDecoration: 'none', letterSpacing: '0.3px' }}>
                0321 2111 406
              </a>
            </div>
          </div>

          {/* WhatsApp Icon */}
          <a
            href="https://wa.me/923212111406"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.4)'
            }}>
              <MessageSquare size={17} color="#ffffff" />
            </div>
          </a>

          {/* Shopping Cart Pill with Badge */}
          <div
            onClick={() => setIsCheckoutOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={22} color="#ffffff" style={{ strokeWidth: 2 }} />
              <span style={{
                position: 'absolute',
                top: '-7px',
                right: '-8px',
                backgroundColor: '#E53935',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #161616'
              }}>
                {cartCount}
              </span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              Rs {cartTotal.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Red Promo Bar (#E53935 with centered badge pills) */}
      <div style={{
        backgroundColor: '#E53935',
        padding: '7px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {[
          'FREE DELIVERY OVER RS 3,000',
          'CASH ON DELIVERY',
          'NATIONWIDE SHIPPING',
          'INSTALLATION SUPPORT'
        ].map((badge) => (
          <div
            key={badge}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.18)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              padding: '4px 14px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)'
            }}
          >
            {badge}
          </div>
        ))}
      </div>

      {/* Main Navbar Links (#111111 Dark Bar) with Vehicle Mega Menu Dropdown */}
      <div
        style={{
          backgroundColor: '#111111',
          borderBottom: '1px solid #1E1E1E',
          position: 'relative',
          zIndex: 40
        }}
        onMouseLeave={() => setIsVehicleMenuOpen(false)}
      >
        <div style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '46px',
          overflowX: 'auto'
        }}>
          {[
            { label: 'HOME', action: () => setView('store') },
            { label: 'SHOP BY VEHICLE', isDropdown: true, action: () => setIsVehicleMenuOpen(prev => !prev) },
            { label: 'CAR CARE', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'EXTERIOR', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'LIGHTING', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'INTERIOR', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'MATS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'ELECTRONICS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'CAR PARTS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'OILS & FILTERS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'WHEELS & TYRES', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'TOOLS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'BRANDS', action: () => { const el = document.getElementById('brands-grid-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
            { label: 'DEALS', isRed: true, action: () => { const el = document.getElementById('featured-deals-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
          ].map((item) => {
            const isVehicleActive = item.isDropdown && isVehicleMenuOpen;
            return (
              <button
                key={item.label}
                onClick={item.action}
                onMouseEnter={() => {
                  if (item.isDropdown) setIsVehicleMenuOpen(true);
                  else setIsVehicleMenuOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isVehicleActive ? '2px solid #E53935' : '2px solid transparent',
                  color: item.isRed ? '#E53935' : isVehicleActive ? '#E53935' : '#D0D0D0',
                  height: '46px',
                  padding: '0 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-ui)',
                  transition: 'color 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!item.isRed && !isVehicleActive) (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  if (!item.isRed && !isVehicleActive) (e.currentTarget as HTMLElement).style.color = '#D0D0D0';
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mega Menu Dropdown Flyout for SHOP BY VEHICLE (Matches screenshot 2) */}
        {isVehicleMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              right: 0,
              backgroundColor: '#161616',
              borderTop: '1px solid #242424',
              borderBottom: '2px solid #E53935',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
              padding: '24px 32px 36px 32px',
              zIndex: 100
            }}
          >
            <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
              {/* Category Subheading */}
              <div style={{
                color: '#E53935',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                paddingBottom: '12px',
                borderBottom: '1px solid #252525',
                marginBottom: '20px'
              }}>
                SHOP BY VEHICLE (BODY KITS & UPGRADES)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '36px' }}>
                {/* Left Column: Car Makes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRight: '1px solid #222222', paddingRight: '20px' }}>
                  {[
                    { name: 'Body Kits & Off-Road', highlight: true },
                    { name: 'Toyota' },
                    { name: 'Honda' },
                    { name: 'Suzuki' },
                    { name: 'Hyundai' },
                    { name: 'KIA' },
                    { name: 'Jaecoo' },
                    { name: 'Mercedes' },
                    { name: 'BMW' },
                    { name: 'Lexus' },
                    { name: 'GWM' },
                    { name: 'BYD' },
                    { name: 'JAC' },
                    { name: 'Range Rover' }
                  ].map((brand) => (
                    <button
                      key={brand.name}
                      onClick={() => {
                        setIsVehicleMenuOpen(false);
                        const el = document.getElementById('part-finder-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        background: brand.highlight ? 'rgba(229, 57, 53, 0.15)' : 'none',
                        color: brand.highlight ? '#E53935' : '#BBBBBB',
                        border: 'none',
                        textAlign: 'left',
                        padding: '7px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: brand.highlight ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = brand.highlight ? 'rgba(229, 57, 53, 0.15)' : 'none';
                        (e.currentTarget as HTMLElement).style.color = brand.highlight ? '#E53935' : '#BBBBBB';
                      }}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>

                {/* Right Area: Vehicle Upgrade Categories with Icons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '24px',
                  alignContent: 'start',
                  paddingTop: '8px'
                }}>
                  {[
                    { label: 'All Body Kits', icon: '🚗' },
                    { label: '4x4 / SUV', icon: '🚙' },
                    { label: 'Side Steps', icon: '🛞' },
                    { label: 'Snorkel', icon: '🤿' },
                    { label: 'Armoured Bumpers', icon: '🛡️' },
                    { label: 'Bull Bars & Guards', icon: '⚙️' },
                    { label: 'Winches', icon: '⛓️' }
                  ].map((cat) => (
                    <div
                      key={cat.label}
                      onClick={() => {
                        setIsVehicleMenuOpen(false);
                        const el = document.getElementById('catalog-products-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'transform 0.15s, background 0.15s, border-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(229,57,53,0.1)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,57,53,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      <div style={{ fontSize: '32px' }}>{cat.icon}</div>
                      <span style={{ fontSize: '11px', color: '#D0D0D0', fontWeight: 600 }}>
                        {cat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View routing for login/admin */}
      {view === 'login' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
          <LoginPage lang={lang} onSuccess={() => setView('store')} onNavigateToSignUp={() => setView('signup')} />
        </main>
      ) : view === 'signup' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
          <SignUpPage lang={lang} onSuccess={() => setView('store')} onNavigateToLogin={() => setView('login')} />
        </main>
      ) : view === 'account' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
          <AccountPage lang={lang} onLogout={() => setView('store')} />
        </main>
      ) : view === 'admin' ? (
        <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 24px', flex: 1 }}>
          <AdminDashboard
            parts={parts}
            orders={orders}
            partRequests={[]}
            makes={[]}
            categories={[]}
            brands={[]}
            qualityGrades={[]}
            onAddPart={(p) => setParts(prev => [p, ...prev])}
            onUpdateOrderStatus={(id, st) => setOrders(prev => prev.map(o => o.id === id ? { ...o, deliveryStatus: st } : o))}
            onRefreshAllData={() => { }}
            lang={lang}
          />
        </main>
      ) : (
        /* =========================================================================
            STOREFRONT MAIN BODY
            ========================================================================= */
        <main style={{ flex: 1 }}>

          {/* =========================================================================
              2. HERO CAROUSEL (Auto-scrolling image slides)
              ========================================================================= */}
          <HeroCarousel
            lang={lang}
            onShopNow={() => {
              const el = document.getElementById('catalog-products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onRequestPart={() => setIsRequestModalOpen(true)}
          />

          {/* =========================================================================
              3. QUICK-LINK CARDS (Overlapping Hero: Brake Discs, Suspension, etc.)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '-40px auto 40px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {[
                { title: 'BRAKE DISCS & PADS', desc: 'Brembo & Advics OEM', icon: '🛑', price: 'FROM 220 SAR' },
                { title: 'SUSPENSION COILOVERS', desc: 'Bilstein & Fox Off-Road', icon: '⚙️', price: 'FROM 1,450 SAR' },
                { title: 'IGNITION PLUGS & COILS', desc: 'NGK Laser Iridium & Denso', icon: '⚡', price: 'FROM 110 SAR' },
                { title: 'ENGINE OILS & FLUIDS', desc: 'Motul 300V, Castrol Edge, Coolant', icon: '🛢️', price: 'FROM 45 SAR' },
                { title: 'TURBO CHARGERS', desc: 'Garrett Twin-Turbo & Actuators', icon: '🌀', price: 'FROM 3,200 SAR' },
                { title: 'PERFORMANCE EXHAUST', desc: 'HKS Hi-Power Stainless Steel', icon: '💨', price: 'FROM 2,100 SAR' }
              ].map(item => (
                <div
                  key={item.title}
                  onClick={() => {
                    const el = document.getElementById('catalog-products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    padding: '14px 14px 12px 14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #DDDDDD',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#1A1A1A', letterSpacing: '0.3px' }}>
                      {item.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666666', marginBottom: '10px', height: '28px', lineHeight: '14px' }}>
                    {item.desc}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#888888' }}>Price</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935' }}>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              4. PART FINDER CARD (Select Make -> Model -> Year -> Variant)
              ========================================================================= */}
          <section id="part-finder-section" style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #DDDDDD',
              padding: '20px 24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={18} color="#E53935" />
                  <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1A1A1A' }}>
                    SELECT YOUR VEHICLE
                  </span>
                  <span style={{ color: '#888888', margin: '0 6px' }}>|</span>
                  <span style={{ fontSize: '12px', color: '#666666', cursor: 'pointer' }} onClick={() => setIsRequestModalOpen(true)}>
                    SEARCH BY OEM / PART NUMBER INSTEAD
                  </span>
                </div>

                {selectedVehicle && (
                  <div style={{ fontSize: '12px', color: '#0d8239', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} />
                    <span>Active Garage: {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
                    <button onClick={() => setSelectedVehicle(null)} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontSize: '11px', marginLeft: '6px' }}>
                      Change
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleApplyFinder} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) 160px',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#666666', marginBottom: '4px' }}>
                    1. MAKE
                  </label>
                  <select
                    value={finderMake}
                    onChange={(e) => setFinderMake(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '4px',
                      border: '1px solid #DDDDDD',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#F7F8F9',
                      outline: 'none'
                    }}
                  >
                    {POPULAR_VEHICLES.map(v => (
                      <option key={v.make} value={v.make}>{v.make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#666666', marginBottom: '4px' }}>
                    2. MODEL
                  </label>
                  <select
                    value={finderModel}
                    onChange={(e) => setFinderModel(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '4px',
                      border: '1px solid #DDDDDD',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#F7F8F9',
                      outline: 'none'
                    }}
                  >
                    {(POPULAR_VEHICLES.find(v => v.make === finderMake)?.models || ['Land Cruiser (LC300)']).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#666666', marginBottom: '4px' }}>
                    3. YEAR
                  </label>
                  <select
                    value={finderYear}
                    onChange={(e) => setFinderYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '4px',
                      border: '1px solid #DDDDDD',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#F7F8F9',
                      outline: 'none'
                    }}
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#666666', marginBottom: '4px' }}>
                    4. ENGINE / VARIANT
                  </label>
                  <select
                    value={finderVariant}
                    onChange={(e) => setFinderVariant(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '4px',
                      border: '1px solid #DDDDDD',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#F7F8F9',
                      outline: 'none'
                    }}
                  >
                    <option value="3.5L Twin-Turbo V6 (V35A)">3.5L Twin-Turbo V6 (V35A)</option>
                    <option value="4.0L V6 1GR-FE">4.0L V6 1GR-FE</option>
                    <option value="3.3L Twin-Turbo Diesel (F33A)">3.3L Twin-Turbo Diesel (F33A)</option>
                    <option value="5.6L V8 VK56VD">5.6L V8 VK56VD</option>
                  </select>
                </div>

                <div style={{ paddingTop: '18px' }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: '#E53935',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Search size={15} />
                    <span>FIND PARTS</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* =========================================================================
              5. FEATURED CATEGORIES (4 Dark Graphic Cards)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1A1A1A', margin: 0 }}>
                  FEATURED CATEGORIES
                </h2>
              </div>
              <div style={{ fontSize: '12px', color: '#E53935', fontWeight: 700, cursor: 'pointer' }}>
                BROWSE ALL CATEGORIES &gt;
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {[
                { title: 'BRAKING SYSTEMS', sub: 'Rotors, pads, calipers & brake lines', count: '1,450+ Products', img: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?w=600&q=80' },
                { title: 'ENGINE COMPONENTS', sub: 'Pistons, camshafts & injectors', count: '3,800+ Products', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80' },
                { title: 'SUSPENSION & STEERING', sub: 'Coilovers, struts, sway bars & bushings', count: '2,100+ Products', img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80' },
                { title: 'BODY & AERODYNAMICS', sub: 'Fenders, splitters, spoilers & widebodies', count: '950+ Products', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80' }
              ].map(cat => (
                <div
                  key={cat.title}
                  style={{
                    height: '240px',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: `url(${cat.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  className="hover-lift"
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.92) 100%)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        {cat.count}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {cat.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '14px' }}>
                        {cat.sub}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              6. FLASH AUTO DEALS & CLEARANCE (3 Cards: SAR 799, 1,850, 420)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#E53935" />
                <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                  FLASH AUTO DEALS & CLEARANCE
                </h2>
              </div>
              <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
                ⏰ Limited-Time Inventory Reserves
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                {
                  id: 'd1',
                  badge: 'SAVE 35%',
                  title: 'Brembo Racing Carbon-Ceramic Front Brake Pads Set',
                  specs: 'Fits LC300, Patrol Y62, Sierra Denali',
                  price: 'SAR 799',
                  oldPrice: 'SAR 1,220',
                  stockTag: '14 Units In Stock'
                },
                {
                  id: 'd2',
                  badge: 'SAVE 28%',
                  title: 'Bilstein B8 Heavy-Duty Gas Pressure Shock Absorber Kit',
                  specs: 'Complete set of 4 dampers for extreme desert travel',
                  price: 'SAR 1,850',
                  oldPrice: 'SAR 2,550',
                  stockTag: '8 Sets Left In Riyadh'
                },
                {
                  id: 'd3',
                  badge: 'SAVE 40%',
                  title: 'K&N High-Flow Performance Cold Air Intake System',
                  specs: 'Mandrel-bent thermal heat shield with oiled dual filter',
                  price: 'SAR 420',
                  oldPrice: 'SAR 699',
                  stockTag: '21 Kits Available'
                }
              ].map(deal => (
                <div
                  key={deal.id}
                  style={{
                    backgroundColor: '#1E1E1E',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '210px'
                  }}
                  className="hover-lift"
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{
                        backgroundColor: '#FF6600',
                        color: '#1A1A1A',
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '3px'
                      }}>
                        {deal.badge}
                      </span>
                      <span style={{ fontSize: '11px', color: '#999999' }}>{deal.stockTag}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>
                        {deal.price}
                      </span>
                      <span style={{ fontSize: '13px', color: '#777777', textDecoration: 'line-through' }}>
                        {deal.oldPrice}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '6px', lineHeight: '1.3' }}>
                      {deal.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999999', marginBottom: '16px' }}>
                      {deal.specs}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const el = document.getElementById('catalog-products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#E53935',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    CLAIM OFFER
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              7. SHOP BY CAR BRAND (6 Clean White Cards)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                SHOP BY CAR BRAND
              </h2>
              <div style={{ fontSize: '12px', color: '#888888', fontWeight: 600 }}>
                Compatible Genuine OEM & Tuner Parts
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {[
                { name: 'TOYOTA', desc: 'Land Cruiser, Hilux', icon: '🚗' },
                { name: 'NISSAN', desc: 'Patrol Y62, GT-R', icon: '🚙' },
                { name: 'FORD', desc: 'Raptor, Mustang', icon: '🏎️' },
                { name: 'GMC', desc: 'Sierra, Yukon', icon: '🛻' },
                { name: 'LEXUS', desc: 'LX600, ES350', icon: '🚘' },
                { name: 'HYUNDAI', desc: 'Sonata, Elantra', icon: '🚐' }
              ].map(brand => (
                <div
                  key={brand.name}
                  onClick={() => {
                    setFinderMake(brand.name.charAt(0) + brand.name.slice(1).toLowerCase());
                    const el = document.getElementById('part-finder-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    padding: '20px 10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  className="hover-lift"
                >
                  <span style={{ fontSize: '32px', marginBottom: '8px' }}>{brand.icon}</span>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#1A1A1A', marginBottom: '2px' }}>
                    {brand.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888888' }}>
                    {brand.desc}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              8. TOP TRENDING PARTS (Gradient Red Header + Orange Filter Pills + 4-Col Grid)
              ========================================================================= */}
          <section id="catalog-products-section" style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #D42B2B 0%, #FF6600 40%, #1A1A1A 100%)',
              borderRadius: '8px 8px 0 0',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff'
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  HOT IN SAUDI & GCC TUNING
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>
                  TOP TRENDING PARTS
                </div>
              </div>

              {/* Orange Filter Pills */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'all', label: 'ALL CATEGORIES' },
                  { id: 'brakes', label: 'BRAKES' },
                  { id: 'exhaust', label: 'PERF EXHAUST' },
                  { id: 'fluids', label: 'OILS & FLUID' },
                  { id: 'ignition', label: 'RACE SPARK' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTrendingTab(tab.id as any)}
                    style={{
                      backgroundColor: trendingTab === tab.id ? '#FF6600' : 'rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      border: trendingTab === tab.id ? '1px solid #FF6600' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Col Product Cards */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 8px 8px',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {trendingProducts.map(p => (
                <PartCard
                  key={p.id}
                  part={p}
                  selectedVehicle={selectedVehicle}
                  onAddToCart={handleAddToCart}
                  onViewDetails={setActivePart}
                  lang={lang}
                />
              ))}
            </div>
          </section>

          {/* =========================================================================
              9. MOTORING & MAINTENANCE GUIDES (3 Blog Cards)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                MOTORING & MAINTENANCE GUIDES
              </h2>
              <div style={{ fontSize: '12px', color: '#888888', fontWeight: 600 }}>
                Written by Certified Master Technicians
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                {
                  tag: 'MAINTENANCE',
                  title: 'How to Choose the Right Ceramic Brake Pads for Gulf Summer Temperatures',
                  desc: 'Discover how rotor thickness and thermal-dissipating brake lubricants protect brake fluid from boiling during 50°C track or dune runs.',
                  img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&q=80',
                  time: '5 min read'
                },
                {
                  tag: 'PERFORMANCE',
                  title: 'LC300 Twin-Turbo Upgrade Guide: Power Gains vs Fuel Economy',
                  desc: 'Comprehensive review of cat-back exhaust systems, high-flow air filters and remap options for the 3.5L Twin-Turbo V35A engine.',
                  img: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&q=80',
                  time: '7 min read'
                },
                {
                  tag: 'OFF-ROAD',
                  title: 'Step-by-Step Suspension Lift Kit Installation for Dune Bashing',
                  desc: 'Everything you need to know about spring rates, reservoir shocks and control arms required for safety in the desert.',
                  img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&q=80',
                  time: '6 min read'
                }
              ].map(post => (
                <div
                  key={post.title}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #DDDDDD'
                  }}
                  className="hover-lift"
                >
                  <div style={{ height: '180px', overflow: 'hidden' }}>
                    <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF6600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      {post.tag}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A', lineHeight: '1.3', marginBottom: '8px', height: '36px', overflow: 'hidden' }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666666', lineHeight: '18px', marginBottom: '14px', height: '54px', overflow: 'hidden' }}>
                      {post.desc}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '10px', fontSize: '11px', color: '#888888' }}>
                      <span>{post.time}</span>
                      <span style={{ color: '#E53935', fontWeight: 700 }}>Read Article &gt;</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button style={{
                backgroundColor: '#1A1A1A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 40px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}>
                VIEW ALL MOTOGUIDE BLOGS
              </button>
            </div>
          </section>

          {/* =========================================================================
              10. WHY CHOOSE US (Dark #111 Band with 4 Stats + 4 Feature Cards)
              ========================================================================= */}
          <section style={{ backgroundColor: '#111111', color: '#ffffff', padding: '60px 0 70px 0', marginBottom: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                  WHY AUTOPARTS
                </h2>
                <div style={{ fontSize: '13px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  The Premier Destination for Auto Parts & Upgrades
                </div>
              </div>

              {/* 4 Stats Panel */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                textAlign: 'center',
                gap: '16px',
                marginBottom: '40px'
              }}>
                <div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: '#E53935' }}>45,000+</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>REAL PARTS IN STOCK</div>
                </div>
                <div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: '#FF6600' }}>99.4%</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>VERIFIED FITMENT ACCURACY</div>
                </div>
                <div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: '#E53935' }}>24-48H</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>EXPRESS KSA DOOR-TO-DOOR</div>
                </div>
                <div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: '#FF6600' }}>18+</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>AUTOMOTIVE BRANDS SUPPORTED</div>
                </div>
              </div>

              {/* 4 Feature Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { title: '100% GENUINE OEM', desc: 'Direct sourcing from tier-1 global manufacturers.', icon: '🛡️' },
                  { title: 'VIN FITMENT VERIFIED', desc: 'Cross-checked with official databases before fulfillment.', icon: '🎯' },
                  { title: 'LOCAL WAREHOUSES', desc: 'Fast delivery from hubs located in Riyadh and Jeddah.', icon: '🏢' },
                  { title: 'EXPERT ENGINE SUPPORT', desc: 'Consult automotive specialists on WhatsApp anytime.', icon: '👨‍🔧' }
                ].map(feat => (
                  <div
                    key={feat.title}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '24px 20px'
                    }}
                  >
                    <div style={{ fontSize: '26px', marginBottom: '12px' }}>{feat.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                      {feat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =========================================================================
              11. ALLOY WHEELS & TIRES ROW (5 Products: Volk TE37, Method, BFGoodrich KO3, Michelin, Advan)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                  ALLOY WHEELS & TIRES
                </h2>
                <div style={{ fontSize: '11px', color: '#888888' }}>
                  Forged off-road & track lightweight options for all terrains
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#E53935', fontWeight: 700, cursor: 'pointer' }}>
                VIEW ALL 240+ &gt;
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {wheelProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActivePart(p)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #DDDDDD',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                  }}
                  className="hover-lift"
                >
                  <div style={{ height: '140px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.images[0]} alt={p.nameEn} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '10px', borderTop: '1px solid #f0f0f0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '10px', color: '#888888', fontWeight: 700 }}>{p.brand}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', height: '32px', overflow: 'hidden', lineHeight: '16px' }}>
                      {p.nameEn}
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#E53935' }}>SAR {p.price}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        style={{ background: '#111111', color: '#fff', border: 'none', borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              12. ROUTINE SERVICE & FILTERS (5 Products: Toyota filter, Air Filter, Cabin filter, Castrol, Coolant)
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                  ROUTINE SERVICE & FILTERS
                </h2>
                <div style={{ fontSize: '11px', color: '#888888' }}>
                  Original OEM replacements for regular oil changes and scheduled maintenance
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#E53935', fontWeight: 700, cursor: 'pointer' }}>
                VIEW ALL 410+ &gt;
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {filterProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActivePart(p)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #DDDDDD',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                  }}
                  className="hover-lift"
                >
                  <div style={{ height: '140px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.images[0]} alt={p.nameEn} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '10px', borderTop: '1px solid #f0f0f0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '10px', color: '#888888', fontWeight: 700 }}>{p.brand}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', height: '32px', overflow: 'hidden', lineHeight: '16px' }}>
                      {p.nameEn}
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#E53935' }}>SAR {p.price}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        style={{ background: '#111111', color: '#fff', border: 'none', borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              13. ORANGE CTA BAND ("Can't Find Your Part Or Chassis Number?")
              ========================================================================= */}
          <section style={{
            background: 'linear-gradient(135deg, #D42B2B 0%, #FF6600 100%)',
            color: '#ffffff',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📍</div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                CAN'T FIND YOUR CAR PART OR CHASSIS NUMBER?
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '22px' }}>
                Send your vehicle registration (Istimarrah) or VIN to our master technicians on WhatsApp for instant part lookup and guaranteed fitment quotation.
              </p>
              <a
                href="https://wa.me/966501234567"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1A1A1A',
                  padding: '12px 36px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <MessageSquare size={16} color="#25D366" />
                <span>CHAT WITH US ON WHATSAPP NOW</span>
              </a>
            </div>
          </section>

          {/* =========================================================================
              14. FOOTER: TRUST STRIP + 5-COL BODY + PAYMENT BADGES
              ========================================================================= */}
          {/* Trust Strip */}
          <div style={{
            backgroundColor: '#1E1E1E',
            borderTop: '3px solid #E53935',
            padding: '24px',
            color: '#ffffff'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={28} color="#E53935" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>100% Genuine Parts</div>
                  <div style={{ fontSize: '11px', color: '#999999' }}>Only OEM & verified aftermarket</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Truck size={28} color="#E53935" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>Fast KSA Delivery</div>
                  <div style={{ fontSize: '11px', color: '#999999' }}>Express 24-48h door-to-door</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Headphones size={28} color="#E53935" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>Expert Tech Support</div>
                  <div style={{ fontSize: '11px', color: '#999999' }}>Real automotive technicians</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <RefreshCw size={28} color="#E53935" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>Easy 14-Day Returns</div>
                  <div style={{ fontSize: '11px', color: '#999999' }}>Hassle-free guarantee & refunds</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Column Dark Body */}
          <footer style={{ backgroundColor: '#141414', color: '#ffffff', padding: '48px 24px 32px 24px', borderTop: '1px solid #2A2A2A' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 175px 175px 175px 1fr', gap: '28px' }}>
              {/* Col 1: Wordmark & Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #E53935 0%, #D42B2B 100%)',
                    borderRadius: '8px',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4">
                      <polygon points="12 2 2 8.5 2 15.5 12 22 22 15.5 22 8.5 12 2" />
                      <circle cx="12" cy="12" r="3" fill="#ffffff" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>AUTOPARTS<span style={{ color: '#E53935' }}>.sa</span></span>
                </div>
                <p style={{ fontSize: '12px', color: '#999999', lineHeight: '18px', marginBottom: '14px' }}>
                  No.1 Online Auto Store. Supplying OEM & high-grade performance parts and car accessories nationwide.
                </p>
                <div style={{ fontSize: '11px', color: '#777777' }}>
                  📍 Nationwide Delivery | Phone: 0321 2111 406
                </div>
              </div>

              {/* Col 2: Shop Categories */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>SHOP CATEGORIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#999999' }}>
                  <span>Brembo Brake Kits</span>
                  <span>Direct OEM Filters</span>
                  <span>Coilovers & Shocks</span>
                  <span>Exhaust & Downpipes</span>
                  <span>Alloy Wheels & Tires</span>
                </div>
              </div>

              {/* Col 3: Top Brands */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>TOP BRANDS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#999999' }}>
                  <span>Toyota Genuine</span>
                  <span>Brembo Racing</span>
                  <span>Bilstein HD</span>
                  <span>Motul Motorsport</span>
                  <span>NGK Spark Plugs</span>
                </div>
              </div>

              {/* Col 4: Customer Service */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>CUSTOMER SERVICE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#999999' }}>
                  <span>Shipping & Tracking</span>
                  <span>Warranty Policy</span>
                  <span>Return & Exchange</span>
                  <span>ZATCA E-Invoicing</span>
                  <span>Terms & Conditions</span>
                </div>
              </div>

              {/* Col 5: Newsletter */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>NEWSLETTER</div>
                <p style={{ fontSize: '12px', color: '#999999', marginBottom: '12px' }}>
                  Subscribe to receive discount alerts and new catalog arrivals.
                </p>
                <div style={{ display: 'flex', height: '36px' }}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                      flex: 1,
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #333333',
                      borderRadius: '4px 0 0 4px',
                      padding: '0 10px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button style={{
                    backgroundColor: '#E53935',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0 4px 4px 0',
                    padding: '0 16px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}>
                    JOIN
                  </button>
                </div>
              </div>
            </div>

            {/* Copyright bar with payment badges */}
            <div style={{
              maxWidth: '1200px',
              margin: '36px auto 0 auto',
              paddingTop: '20px',
              borderTop: '1px solid #222222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#777777'
            }}>
              <div>
                © 2026 AUTOPARTS. All Rights Reserved.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>mada</span>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>Apple Pay</span>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>VISA</span>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>Mastercard</span>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>STC Pay</span>
                <span style={{ backgroundColor: '#222222', padding: '3px 8px', borderRadius: '3px', color: '#ffffff', fontWeight: 700 }}>Tamara</span>
              </div>
            </div>
          </footer>

        </main>
      )}

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
        onOrderPlaced={(newOrder) => {
          setOrders(prev => [newOrder, ...prev]);
          setCart([]);
        }}
        lang={lang}
      />

      <PartRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        selectedVehicle={selectedVehicle}
        onSubmit={() => { }}
        lang={lang}
      />

    </div>
  );
}

export default App;
