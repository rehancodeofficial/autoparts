import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { ProductDetailPage } from './components/ProductDetailPage';
import { AboutUsPage } from './components/AboutUsPage';
import { ContactUsPage } from './components/ContactUsPage';
import { LegalPage } from './components/LegalPage';
import { useAuth } from './context/AuthContext';
import {
  Search, ShoppingCart, Phone, MessageSquare, ChevronRight, ChevronLeft,
  Car, ShieldCheck, Truck, RefreshCw, Headphones, Check, ArrowRight,
  User as UserIcon, LogIn, UserPlus, LogOut, Package, MapPin, X, Flame, Sparkles, Menu, ChevronDown
} from 'lucide-react';

export function App() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [view, setView] = useState<'store' | 'admin' | 'login' | 'signup' | 'account' | '404' | 'product' | 'about' | 'contact' | 'terms' | 'privacy' | 'cookies'>('store');
  const [selectedPdpPart, setSelectedPdpPart] = useState<Part | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [navbarBottom, setNavbarBottom] = useState(93);

  // Parts & Cart (Cleared mock and dummy data)
  const [parts, setParts] = useState<Part[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
    setToastMessage({ text: `Added "${part.name}" to cart!`, type: 'success' });
    setTimeout(() => {
      setToastMessage(prev => prev?.text.includes(part.name) ? null : prev);
    }, 3500);
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

  // Track navbar bottom for dropdown positioning
  useEffect(() => {
    const updateNavbarBottom = () => {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        setNavbarBottom(rect.bottom);
      }
    };
    updateNavbarBottom();
    window.addEventListener('scroll', updateNavbarBottom, { passive: true });
    window.addEventListener('resize', updateNavbarBottom);
    return () => {
      window.removeEventListener('scroll', updateNavbarBottom);
      window.removeEventListener('resize', updateNavbarBottom);
    };
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#EEEEEE' }}>

      {/* =========================================================================
          1. HEADER COMPONENT (Exact Match to Screenshot)
          ========================================================================= */}

      {/* Top micro bar removed per user request */}

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
        {/* Autoparts Logo + Mobile Hamburger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '6px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            className="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setView('store')}
          >
            {/* Brand Logo Image from /favicon.png */}
            <img
              src="/favicon.png"
              alt="AUTOPARTS"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '22px',
                fontWeight: 900,
                fontFamily: 'var(--font-content)',
                letterSpacing: '0.8px',
                color: '#ffffff',
                lineHeight: '1.1'
              }}>
                AUTOPARTS
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
                marginTop: '2px'
              }}>
                NO.1 ONLINE AUTO STORE • KSA
              </span>
            </div>
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
                TOLL FREE KSA
              </span>
              <a href="tel:+9668001249900" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', textDecoration: 'none', letterSpacing: '0.3px' }}>
                800 124 9900
              </a>
            </div>
          </div>

          {/* Official WhatsApp Logo Icon */}
          <a
            href="https://wa.me/966501234567"
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
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.45)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
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
              SAR {cartTotal.toLocaleString('en-US')}
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
          'FREE EXPRESS SHIPPING OVER 300 SAR',
          '100% GENUINE OEM GUARANTEED',
          'CASH ON DELIVERY IN KSA',
          'DISPATCH FROM RIYADH & JEDDAH'
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
        ref={navbarRef}
        style={{
          backgroundColor: '#111111',
          borderBottom: '1px solid #1E1E1E',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          overflow: 'visible'
        }}
        onMouseLeave={() => {
          setIsVehicleMenuOpen(false);
          setActiveDropdown(null);
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0px',
            height: '46px',
            overflow: 'visible',
            flexWrap: 'nowrap'
          }}
        >
          {[
            { label: 'HOME', action: () => { setView('store'); setActiveDropdown(null); setIsVehicleMenuOpen(false); } },
            { label: 'ABOUT US', action: () => { setView('about'); setActiveDropdown(null); setIsVehicleMenuOpen(false); window.scrollTo(0, 0); } },
            {
              label: 'CAR CARE',
              items: [
                { name: 'Ceramic Coatings & Sealants', count: '14 items' },
                { name: 'Car Wash Shampoos & Foam', count: '28 items' },
                { name: 'Detailing Sprays & Quick Wax', count: '19 items' },
                { name: 'Microfiber Towels & Wash Mitts', count: '32 items' },
                { name: 'Leather Cleaners & Conditioners', count: '12 items' },
                { name: 'Tire Shine & Wheel Cleaners', count: '16 items' },
                { name: 'Glass & Windshield Treatment', count: '9 items' }
              ]
            },
            {
              label: 'EXTERIOR',
              items: [
                { name: 'Carbon Fiber Spoilers & Wings', count: '24 items' },
                { name: 'Front Bumpers & Splitters', count: '18 items' },
                { name: 'Side Skirts & Extensions', count: '15 items' },
                { name: 'Roof Racks & Cross Bars', count: '11 items' },
                { name: 'Mud Flaps & Splash Guards', count: '14 items' },
                { name: 'Door Visors & Deflectors', count: '22 items' }
              ]
            },
            {
              label: 'LIGHTING',
              items: [
                { name: 'LED Headlight Conversion Bulbs', count: '45 items' },
                { name: 'Off-Road LED Light Bars', count: '20 items' },
                { name: 'Fog Lamps & Daytime Running Lights', count: '18 items' },
                { name: 'Smoked LED Tail Lights', count: '16 items' },
                { name: 'Interior Ambient Kits', count: '12 items' }
              ]
            },
            {
              label: 'INTERIOR',
              items: [
                { name: 'Steering Wheel Covers & Alcantara', count: '18 items' },
                { name: 'Custom Fit Seat Covers', count: '26 items' },
                { name: 'Dashboard Mats & Sunshades', count: '14 items' },
                { name: 'Center Console Organizers', count: '12 items' },
                { name: 'Luxury Air Fresheners', count: '30 items' }
              ]
            },
            {
              label: 'CAR PARTS',
              items: [
                { name: 'Brembo Ceramic Brake Pads & Rotors', count: '64 items' },
                { name: 'Suspension Coilovers & Shocks', count: '32 items' },
                { name: 'Alternators, Starters & Batteries', count: '28 items' },
                { name: 'Turbochargers & Intercoolers', count: '19 items' },
                { name: 'Radiators & Water Pumps', count: '22 items' },
                { name: 'Clutches & Drivetrain Kits', count: '17 items' }
              ]
            },
            {
              label: 'OILS & FILTERS',
              items: [
                { name: 'Motul & Castrol Full Synthetic 5W-30 / 0W-20', count: '30 items' },
                { name: 'OEM Engine Oil Filters', count: '48 items' },
                { name: 'High-Flow Cabin Air & AC Filters', count: '36 items' },
                { name: 'Transmission & Gearbox Fluids', count: '18 items' },
                { name: 'DOT 5.1 Racing Brake Fluids', count: '12 items' },
                { name: 'Long-Life Radiator Coolants', count: '15 items' }
              ]
            },
            {
              label: 'WHEELS & TYRES',
              items: [
                { name: 'Forged & Flow-Formed Alloy Wheels', count: '40 items' },
                { name: 'All-Terrain & Desert Dune Tires', count: '28 items' },
                { name: 'Wheel Spacers & Hubcentric Rings', count: '16 items' },
                { name: 'Lug Nuts & Anti-Theft Lock Sets', count: '22 items' },
                { name: 'Portable Tire Inflators & Gauges', count: '14 items' }
              ]
            },
            {
              label: 'BRANDS',
              items: [
                { name: 'Toyota Genuine OEM Parts', count: '500+ items' },
                { name: 'Nissan Motor Parts', count: '350+ items' },
                { name: 'Brembo Racing & Brakes', count: '120+ items' },
                { name: 'Bilstein Suspension Germany', count: '85+ items' },
                { name: 'Motul High-Tech Lubricants', count: '65+ items' },
                { name: 'NGK Laser Iridium Plugs', count: '140+ items' },
                { name: 'K&N High-Flow Air Filters', count: '90+ items' }
              ]
            },
            { label: 'DEALS', isRed: true, action: () => { const el = document.getElementById('featured-deals-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setActiveDropdown(null); setIsVehicleMenuOpen(false); } },
            { label: 'CONTACT US', action: () => { setView('contact'); setActiveDropdown(null); setIsVehicleMenuOpen(false); window.scrollTo(0, 0); } },
          ].map((item) => {
            const isVehicleActive = item.isVehicleDropdown && isVehicleMenuOpen;
            const isNavDropdownActive = activeDropdown === item.label;
            const isActive = isVehicleActive || isNavDropdownActive;

            return (
              <div
                key={item.label}
                style={{ position: 'static', flexShrink: 0 }}
                onMouseEnter={() => {
                  if (item.isVehicleDropdown) {
                    setIsVehicleMenuOpen(true);
                    setActiveDropdown(null);
                  } else if (item.items) {
                    setActiveDropdown(item.label);
                    setIsVehicleMenuOpen(false);
                  } else {
                    setActiveDropdown(null);
                    setIsVehicleMenuOpen(false);
                  }
                }}
              >
                <button
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.items) {
                      setActiveDropdown(prev => prev === item.label ? null : item.label);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #E53935' : '2px solid transparent',
                    color: item.isRed ? '#E53935' : isActive ? '#E53935' : '#D0D0D0',
                    height: '46px',
                    padding: '0 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-ui)',
                    transition: 'color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => {
                    if (!item.isRed && !isActive) (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    if (!item.isRed && !isActive) (e.currentTarget as HTMLElement).style.color = '#D0D0D0';
                  }}
                >
                  <span>{item.label}</span>
                  {item.items && (
                    <ChevronDown size={12} color={isActive ? '#E53935' : '#888888'} />
                  )}
                </button>

                {/* Standard Dropdown Flyout for category items */}
                {activeDropdown === item.label && item.items && (
                  <div
                    style={{
                      position: 'fixed',
                      top: `${navbarBottom}px`,
                      left: 'auto',
                      minWidth: '280px',
                      backgroundColor: '#161616',
                      borderTop: '2px solid #E53935',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                      padding: '12px 0',
                      zIndex: 9999,
                      borderRadius: '0 0 8px 8px'
                    }}
                  >
                    <div style={{
                      padding: '4px 16px 8px 16px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#E53935',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #222222',
                      marginBottom: '6px'
                    }}>
                      EXPLORE {item.label}
                    </div>
                    {item.items.map((sub, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveDropdown(null);
                          const el = document.getElementById('catalog-products-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#CCCCCC',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                          (e.currentTarget as HTMLElement).style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#CCCCCC';
                        }}
                      >
                        <span>{sub.name}</span>
                        <span style={{ fontSize: '10px', color: '#666666' }}>{sub.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mega Menu Dropdown Flyout for SHOP BY VEHICLE (Matches screenshot 2) */}
        {isVehicleMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: `${navbarBottom}px`,
              left: 0,
              right: 0,
              backgroundColor: '#161616',
              borderTop: '1px solid #242424',
              borderBottom: '2px solid #E53935',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
              padding: '24px 32px 36px 32px',
              zIndex: 9999
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
                    { label: 'All Body Kits', tag: 'AERO' },
                    { label: '4x4 / SUV', tag: 'OFF-ROAD' },
                    { label: 'Side Steps', tag: 'STEPS' },
                    { label: 'Snorkel', tag: 'INTAKE' },
                    { label: 'Armoured Bumpers', tag: 'GUARD' },
                    { label: 'Bull Bars & Guards', tag: 'PROTECTION' },
                    { label: 'Winches', tag: 'RECOVERY' }
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
                        gap: '10px',
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
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(229,57,53,0.15)',
                        color: '#E53935',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900
                      }}>
                        {cat.tag.slice(0, 3)}
                      </div>
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
        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              backgroundColor: '#161616',
              borderTop: '1px solid #222222',
              borderBottom: '2px solid #E53935',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {[
              { label: 'HOME', action: () => { setView('store'); setIsMobileMenuOpen(false); } },
              { label: 'SHOP BY VEHICLE', action: () => { const el = document.getElementById('part-finder-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'CAR CARE', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'EXTERIOR', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'LIGHTING', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'INTERIOR', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'MATS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'ELECTRONICS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'CAR PARTS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'OILS & FILTERS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'WHEELS & TYRES', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'TOOLS', action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'BRANDS', action: () => { const el = document.getElementById('brands-grid-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } },
              { label: 'DEALS', isRed: true, action: () => { const el = document.getElementById('featured-deals-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); } }
            ].map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                style={{
                  background: 'none',
                  border: 'none',
                  color: link.isRed ? '#E53935' : '#D0D0D0',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}
              >
                {link.label}
              </button>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #222222' }}>
              <button
                onClick={() => { if (!user) setView('login'); else setView('account'); setIsMobileMenuOpen(false); }}
                style={{
                  flex: 1,
                  backgroundColor: '#222222',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {user ? user.name : 'My Account'}
              </button>
              <button
                onClick={() => { setView(view === 'store' ? 'admin' : 'store'); setIsMobileMenuOpen(false); }}
                style={{
                  flex: 1,
                  backgroundColor: '#E53935',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {view === 'store' ? 'Admin Portal' : 'Store'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View routing for login/admin/404 */}
      {view === '404' ? (
        <main style={{ maxWidth: '800px', width: '100%', margin: '80px auto', padding: '0 24px', textAlign: 'center', flex: 1 }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '60px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #E0E0E0'
          }}>
            <div style={{ fontSize: '72px', fontWeight: 900, color: '#E53935', lineHeight: '1', marginBottom: '16px', fontFamily: 'var(--font-content)' }}>
              404
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', marginBottom: '12px', textTransform: 'uppercase' }}>
              Part Or Page Not Found
            </h1>
            <p style={{ fontSize: '14px', color: '#666666', maxWidth: '440px', margin: '0 auto 28px auto', lineHeight: '1.5' }}>
              The auto part or catalog page you requested has been moved, relocated, or is no longer listed in our database.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setView('store')}
                style={{
                  backgroundColor: '#E53935',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px 28px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                RETURN TO CATALOG
              </button>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                style={{
                  backgroundColor: '#1A1A1A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px 28px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                REQUEST PART BY VIN
              </button>
            </div>
          </div>
        </main>
      ) : view === 'login' ? (
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
      ) : view === 'product' ? (
        <main style={{ flex: 1 }}>
          <ProductDetailPage
            part={selectedPdpPart}
            selectedVehicle={selectedVehicle}
            onBack={() => setView('store')}
            onAddToCart={handleAddToCart}
          />
        </main>
      ) : view === 'about' ? (
        <AboutUsPage onNavigateHome={() => setView('store')} />
      ) : view === 'contact' ? (
        <ContactUsPage onNavigateHome={() => setView('store')} />
      ) : view === 'terms' ? (
        <LegalPage page="terms" />
      ) : view === 'privacy' ? (
        <LegalPage page="privacy" />
      ) : view === 'cookies' ? (
        <LegalPage page="cookies" />
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
              3. CATEGORY SHOWCASE CARDS (Full-Width with Left/Right Arrows)
              ========================================================================= */}
          <section style={{ width: '100%', margin: '-44px 0 36px 0', padding: '0 16px', position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
            {/* Left Scroll Arrow */}
            <button
              onClick={() => {
                const el = document.getElementById('category-cards-track');
                if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#E53935',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'transform 0.15s, background-color 0.15s'
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft size={22} color="#ffffff" />
            </button>

            {/* Right Scroll Arrow */}
            <button
              onClick={() => {
                const el = document.getElementById('category-cards-track');
                if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#E53935',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'transform 0.15s, background-color 0.15s'
              }}
              aria-label="Scroll right"
            >
              <ChevronRight size={22} color="#ffffff" />
            </button>

            <div
              id="category-cards-track"
              className="no-scrollbar"
              style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                padding: '4px 36px 8px 36px',
                scrollBehavior: 'smooth'
              }}
            >
              {[
                {
                  title: 'BYD SHARK 6',
                  desc: 'Bull bars, side steps, protection plates',
                  img: '/categories/byd_shark.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'DETAILING EQUIPMENT',
                  desc: 'Professional tools & machines',
                  img: '/categories/detailing.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'FLOOR MATS',
                  desc: 'Custom fit for every car',
                  img: '/categories/floor_mats.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'AIR FRESHENERS',
                  desc: 'Little Trees, Areon, Aroma',
                  img: '/categories/air_fresheners.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'JAECOO J7',
                  desc: 'Side steps, mud flaps & more',
                  img: '/categories/jaecoo_j7.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'ENGINE OILS',
                  desc: 'Liqui Moly, Kixx, Mobil',
                  img: '/categories/engine_oils.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'CHROME PARTS',
                  desc: 'Trims, garnishes & handles',
                  img: '/categories/chrome_parts.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'SEAT COVERS',
                  desc: 'Custom fit, leather & fabric',
                  img: '/categories/seat_covers.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'DASH CAMS',
                  desc: '4K & dual-lens recording',
                  img: '/categories/dash_cams.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'BRAKE PADS',
                  desc: 'Brembo, Akebono & Advics',
                  img: '/categories/brake_pads.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'LED LIGHTS',
                  desc: 'Headlights, fog & interior',
                  img: '/categories/led_lights.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'SUSPENSION',
                  desc: 'Coilovers, shocks & springs',
                  img: '/categories/suspension.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                },
                {
                  title: 'EXHAUST SYSTEMS',
                  desc: 'HKS, Borla & custom tips',
                  img: '/categories/exhaust.jpg',
                  action: () => { const el = document.getElementById('catalog-products-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                }
              ].map((card, idx) => (
                <div
                  key={idx}
                  onClick={card.action}
                  style={{
                    flex: '0 0 190px',
                    minWidth: '190px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #DDDDDD',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                  }}
                  className="hover-lift"
                >
                  {/* Top Text Header */}
                  <div style={{ padding: '12px 14px 6px 14px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#1A1A1A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {card.title}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#777777',
                      lineHeight: '1.3',
                      height: '26px',
                      overflow: 'hidden'
                    }}>
                      {card.desc}
                    </div>
                  </div>

                  {/* Product Image Area */}
                  <div style={{
                    height: '110px',
                    padding: '8px 12px 12px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff'
                  }}>
                    <img
                      src={card.img}
                      alt={card.title}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                    />
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
              5. FEATURED CATEGORIES
              ========================================================================= */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1A1A1A', margin: 0 }}>
                FEATURED CATEGORIES
              </h2>
            </div>
            <div style={{
              backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E0E0E0',
              padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <Package size={36} color="#CCCCCC" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#999999', marginBottom: '6px' }}>No Featured Categories Yet</div>
              <div style={{ fontSize: '13px', color: '#BBBBBB' }}>Featured categories will appear here once added.</div>
            </div>
          </section>

          {/* =========================================================================
              6. DEALS & CLEARANCE
              ========================================================================= */}
          <section id="featured-deals-section" style={{ maxWidth: '1200px', margin: '0 auto 40px auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#E53935" />
                <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                  DEALS & CLEARANCE
                </h2>
              </div>
            </div>
            <div style={{
              backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E0E0E0',
              padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <Sparkles size={36} color="#CCCCCC" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#999999', marginBottom: '6px' }}>No Active Deals Right Now</div>
              <div style={{ fontSize: '13px', color: '#BBBBBB' }}>Flash deals and clearance offers will be listed here.</div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {[
                { name: 'TOYOTA', desc: 'Land Cruiser, Hilux', logo: '/brands/toyota.svg' },
                { name: 'NISSAN', desc: 'Patrol Y62, GT-R', logo: '/brands/nissan.svg' },
                { name: 'FORD', desc: 'Raptor, Mustang, F-150', logo: '/brands/ford.svg' },
                { name: 'GMC', desc: 'Sierra, Yukon Denali', logo: '/brands/gmc.svg' },
                { name: 'LEXUS', desc: 'LX600, ES350, GX', logo: '/brands/lexus.svg' },
                { name: 'HYUNDAI', desc: 'Sonata, Tucson, Santa Fe', logo: '/brands/hyundai.svg' }
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
                    padding: '20px 14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  className="hover-lift"
                >
                  <div style={{
                    width: '64px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#1A1A1A', marginBottom: '2px' }}>
                    {brand.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888888', textAlign: 'center' }}>
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

            {/* 4-Col Product Cards or Empty State */}
            {trendingProducts.length > 0 ? (
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
                    onViewDetails={(item) => {
                      setSelectedPdpPart(item);
                      setView('product');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '0 0 8px 8px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F5',
                  color: '#999999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Package size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', marginBottom: '8px', textTransform: 'uppercase' }}>
                  No Parts Found Matching This Filter
                </h3>
                <p style={{ fontSize: '13px', color: '#666666', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                  We could not find any auto parts under this exact category tab. Try selecting "ALL" to browse the full catalog.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setTrendingTab('all')}
                    style={{
                      backgroundColor: '#E53935',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '10px 24px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    RESET FILTERS
                  </button>
                </div>
              </div>
            )}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { title: '100% GENUINE OEM', desc: 'Direct sourcing from tier-1 global manufacturers with factory certificates.', tag: 'CERTIFIED' },
                  { title: 'VIN FITMENT VERIFIED', desc: 'Cross-checked with official databases before fulfillment for zero errors.', tag: 'ACCURACY' },
                  { title: 'LOCAL WAREHOUSES', desc: 'Fast delivery from hubs located in Riyadh and Jeddah across the Kingdom.', tag: 'EXPRESS' },
                  { title: 'EXPERT ENGINE SUPPORT', desc: 'Consult certified automotive specialists on WhatsApp anytime.', tag: 'SUPPORT' }
                ].map(feat => (
                  <div
                    key={feat.title}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '24px 20px',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(229, 57, 53, 0.15)',
                      color: '#E53935',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      marginBottom: '14px'
                    }}>
                      {feat.tag}
                    </div>
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
              13. ORANGE CTA BAND ("Can't Find Your Part Or Chassis Number?")
              ========================================================================= */}
          <section style={{
            background: 'linear-gradient(135deg, #D42B2B 0%, #FF6600 100%)',
            color: '#ffffff',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
                  gap: '10px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
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
                  <img
                    src="/favicon.png"
                    alt="AUTOPARTS"
                    style={{
                      width: '32px',
                      height: '32px',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                  />
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>AUTOPARTS</span>
                </div>
                <p style={{ fontSize: '12px', color: '#999999', lineHeight: '18px', marginBottom: '14px' }}>
                  No.1 Online Auto Store in Saudi Arabia. Supplying verified OEM & performance parts across the Kingdom.
                </p>
                <div style={{ fontSize: '11px', color: '#777777', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#E53935" /> Riyadh Distribution Hub, Anas Ibn Malik Rd, KSA
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="#E53935" /> Phone: <a href="tel:+9668001249900" style={{ color: '#E53935', textDecoration: 'none' }}>+966 800 124 9900</a>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={13} color="#E53935" /> Email: <a href="mailto:support@autoparts.sa" style={{ color: '#E53935', textDecoration: 'none' }}>support@autoparts.sa</a>
                  </span>
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px', color: '#FFFFFF' }}>QUICK LINKS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <button
                    onClick={() => { setView('store'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Home Store
                  </button>
                  <button
                    onClick={() => { setView('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => { setView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Contact Us
                  </button>
                  <button
                    onClick={() => { setIsRequestModalOpen(true); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Request a Part
                  </button>
                </div>
              </div>

              {/* Col 3: Customer Care */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px', color: '#FFFFFF' }}>CUSTOMER CARE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <button
                    onClick={() => { setView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Help & Support
                  </button>
                  <button
                    onClick={() => { setView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Track Order & Shipping
                  </button>
                  <button
                    onClick={() => { setView('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Returns & Refunds
                  </button>
                </div>
              </div>

              {/* Col 4: Legal & Policies */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px', color: '#FFFFFF' }}>LEGAL & POLICIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <button
                    onClick={() => { setView('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Terms & Conditions
                  </button>
                  <button
                    onClick={() => { setView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => { setView('cookies'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#A0A0A0', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
                  >
                    Cookie Policy
                  </button>
                </div>
              </div>

              {/* Col 5: Get exclusive deals & updates (Matches 3rd screenshot) */}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#D5D5D5', marginBottom: '16px', letterSpacing: '0.2px' }}>
                  Get exclusive deals & updates
                </div>
                <div style={{
                  display: 'flex',
                  height: '42px',
                  backgroundColor: '#1E1E1E',
                  borderRadius: '6px',
                  border: '1px solid #2F2F2F',
                  overflow: 'hidden'
                }}>
                  <input
                    type="email"
                    placeholder="Your email"
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '0 14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button style={{
                    backgroundColor: '#E53935',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0 6px 6px 0',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}>
                    Join
                  </button>
                </div>
              </div>
            </div>

            {/* Copyright bar with payment badges and credit */}
            <div style={{
              maxWidth: '1200px',
              margin: '36px auto 0 auto',
              paddingTop: '20px',
              borderTop: '1px solid #222222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px',
              color: '#777777'
            }}>
              <div>
                © 2026 AUTOPARTS. All Rights Reserved. • Designed BY <a href="https://rehanhussain.dev/" target="_blank" rel="noopener noreferrer" style={{ color: '#E53935', textDecoration: 'none', fontWeight: 700 }}>Muhammad Rehan Hussain</a>
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

      {/* Toast Notification Banner (Success & Error Messages) */}
      {toastMessage && (
        <div
          className="toast-popup"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toastMessage.type === 'success' ? '#1b5e20' : '#b71c1c',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '50px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <span>{toastMessage.type === 'success' ? '✓' : '✕'}</span>
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
