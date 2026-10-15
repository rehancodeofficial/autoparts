import React, { useState } from 'react';
import { Part, Vehicle } from '../types';
import {
  ShieldCheck, Truck, RotateCcw, Wrench, CheckCircle2, ChevronRight,
  Share2, Bookmark, Star, HelpCircle, FileText, Check, Phone, MessageSquare, ShoppingCart, ArrowLeft, ArrowRight
} from 'lucide-react';

interface ProductDetailPageProps {
  part?: Part | null;
  selectedVehicle?: Vehicle | null;
  onBack: () => void;
  onAddToCart: (part: Part) => void;
  onOpenWhatsApp?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  part,
  selectedVehicle,
  onBack,
  onAddToCart,
  onOpenWhatsApp
}) => {
  // Gallery thumbnails
  const images = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD35F72pRA7hvGhrHVAz22Va-3IVI1Chug-ZdZuG0Vs4doBOy2I2zXGODL0PVT_6dKrCOQuSqocn7x9t_wxwLKz3rXQzoQ4fz2d4kRIC1xsRAesx95KBwIkUBfw1Xv3n36U73sWo2Jv946CS69B1dgXCaKeToOW4ZQbOl3lKoLYK_DpoaU0hdGOJ0ZAOkSNkSHDrMr6UxZQhkCZHZptetwg9-pqEkwg_VeYjcmPYbTbXrNP084RlGdGqQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCNvvpq6qr2dDAadTA2Fhk3yoglob868u61aBgHelVnmz3tR9PnNy1aZ61-iJuoFpuXAHb5nDPaPk3UqVg73_LPn5Hg08HtGV4D3uJVsp49qfSb2MITE6YujteldP9ywI_HSjn-5OHs7CLeUCTMoWJRCEwi6AFrSJJAeA69aPX2WYL-WHsBUcbtQ_68-h-oR49BvQv71ssAIPXufauux39HGvePdH2_Uc6fmF2vgtCzJZ2KcLgOOma8kA',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC70roJ2R7vTiPjnmLx7-bgpZq7SMIDuhF3kUAzbAEudCbBYNEy2J3DlZlxBEjyuE4WjrMoKoFFxxd9YllWFP4Tp0QuBqGC6EUvyEJ7TmkKeqK9VlidRupx9pWhuUcOKDFDJqFMyYK0NbY6hI3lfOBazQkj0fX77m1gHcv63oSeQefh7nHvpyZb_BlbHuKdFhXjSgYdLVVae1KZkn6siSuzA7BiSAl195lhrTQXgAfgEEIJsXYweowDmw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDx4E_LvstNih7tz1PuxlAH4NIPDRhrccWh5Wo7BmCOxC3yuFQn_J8XHAME_cW3UJl278kvooy5aUg4mgkvag8FVfxKeFE9zNB3QjYjja6-F469XKcinmdkjXr38OnAYjzqLQOJ46mJKajWOq583npdJ0yTWwxDhTVm19SL5-TPqqyZGL9zl4N-9Nh2kQv3vyeZI3SadGlNb4JO6go77DnFEp8Yzral-FAoRp0EG8cVv2KXUsbAjUKjIQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA4eZ1XSQDyBHbjyoZHfssQqRwKAVxjtEbp5emQU8VQUnvWf2uTmWblmN1Rmmu0HbJ7sjpjwsybVyF1FDQ7pi16J0x5gxbWWzpnA2-_SCpcvsl77eI4yNNBXIBRzlTzMPTMXU_UU0cAPhWiTjMYgW_T7vs6L-W2j9cHcren1NBXbmXcOJ285IYXMRGDHyKpORap-alWjlX9CkDGAHUCLMoZET9XKBLvCVwZVDLMr6IsRoXwodSM5AYTFg'
  ];

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'fitment' | 'specs' | 'box' | 'warranty'>('fitment');
  const [filterBrand, setFilterBrand] = useState('all');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Vehicle verification state
  const [vMake, setVMake] = useState('toyota');
  const [vModel, setVModel] = useState('lc300');
  const [vYear, setVYear] = useState('2024');
  const [vTrim, setVTrim] = useState('gr-sport');

  const fitmentRows = [
    { brand: 'toyota', model: 'Toyota Land Cruiser LC300', chassis: 'VJA300 / FJA300', years: '2022 - 2025', engine: '3.5L V6 Twin-Turbo (V35A-FTS)', pos: 'Front Axle', notes: 'Direct OEM bolt-on knuckle. Minimum 20" wheel diameter required.', status: 'Guaranteed Fit' },
    { brand: 'toyota', model: 'Toyota Land Cruiser LC300', chassis: 'FJA300', years: '2022 - 2025', engine: '3.3L V6 Twin-Turbo Diesel (F33A-FTV)', pos: 'Front Axle', notes: 'Direct OEM bolt-on knuckle. Retains factory dust shields with slight trim.', status: 'Guaranteed Fit' },
    { brand: 'lexus', model: 'Lexus LX600', chassis: 'VJA310', years: '2022 - 2025', engine: '3.5L V6 Twin-Turbo (V35A-FTS)', pos: 'Front Axle', notes: 'Clears OEM 20" and 22" F-Sport alloy wheels without wheel spacers.', status: 'Guaranteed Fit' },
    { brand: 'toyota', model: 'Toyota Sequoia', chassis: 'XK80', years: '2023 - 2025', engine: '3.4L i-FORCE MAX Hybrid V6', pos: 'Front Axle', notes: 'Direct mounting with supplied Brembo radial mounting bracket kit.', status: 'Guaranteed Fit' },
    { brand: 'toyota', model: 'Toyota Tundra', chassis: 'XK70', years: '2022 - 2025', engine: '3.4L V6 Twin-Turbo (Non-Hybrid & Hybrid)', pos: 'Front Axle', notes: 'Direct bolt-on. TRD Pro 18" BBS wheels require verification clearance template.', status: 'Guaranteed Fit' },
    { brand: 'nissan', model: 'Nissan Patrol', chassis: 'Y62 (All Series)', years: '2010 - 2024', engine: '5.6L V8 (VK56VD / VK56DE)', pos: 'Front Axle', notes: 'Requires Nissan Y62 adapter bracket (Included in Kit variant SKU BR-AD-Y62).', status: 'Verified w/ Bracket' },
  ];

  const filteredFitment = fitmentRows.filter(r => {
    const matchesBrand = filterBrand === 'all' || r.brand === filterBrand;
    const matchesSearch = !searchTableQuery || 
      r.model.toLowerCase().includes(searchTableQuery.toLowerCase()) || 
      r.chassis.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      r.engine.toLowerCase().includes(searchTableQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  const faqs = [
    {
      q: 'Will this 380mm kit fit under my factory 18-inch or 20-inch wheels?',
      a: 'This Brembo GT 380mm kit requires a minimum of 20-inch diameter wheels for proper barrel clearance. It will not fit factory 17" or 18" wheels without caliper barrel interference. It clears all OEM 20" and 22" wheels found on the Land Cruiser LC300 GR-Sport, ZX, and Lexus LX600 without wheel spacers.'
    },
    {
      q: 'Does installing this big brake kit void my agency vehicle warranty in KSA?',
      a: 'Under Saudi Ministry of Commerce automotive regulations, upgrading brakes with TUV/SASO-compliant OEM replacement parts does not void the vehicle\'s engine, drivetrain, or powertrain agency warranty. Only modified components are subject to separate warranty terms, which are 100% backed by Brembo and AUTOPARTS for 2 full years.'
    },
    {
      q: 'How do I verify 100% fitment with my Istimarah / Chassis Number before ordering?',
      a: 'You can click our "Ask Technician on WhatsApp" button and snap a quick photo of your vehicle registration card (Istimarah) or copy the 17-digit VIN. Our master brake specialists verify brake caliper offset, spindle mount pattern, and master cylinder bore ratio within 5 minutes.'
    }
  ];

  // Price calculations
  const price = part ? part.price : 4890;
  const originalPrice = 5450;
  const title = part ? part.name : 'Brembo GT 6-Piston Big Brake Kit - Front 380mm Drilled (Monobloc 2-Piece)';
  const partNumber = part ? part.partNumber : 'BR-98421-KSA';

  const defaultPartObject: Part = part || {
    id: 'pdp-brembo-gt-6p',
    name: 'Brembo GT 6-Piston Big Brake Kit - Front 380mm Drilled',
    partNumber: 'BR-98421-KSA',
    oemReference: '43512-60200',
    category: 'Brakes & Rotors',
    categorySlug: 'brakes',
    brand: 'Brembo',
    price: 4890,
    inStock: true,
    rating: 4.9,
    reviewsCount: 128,
    images: images,
    description: 'High-performance Brembo Gran Turismo 6-piston monobloc front brake caliper with 380mm drilled floating rotors.',
    fitment: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', yearFrom: 2022, yearTo: 2025 },
      { make: 'Lexus', model: 'LX600', yearFrom: 2022, yearTo: 2025 },
      { make: 'Nissan', model: 'Patrol Y62', yearFrom: 2010, yearTo: 2024 }
    ],
    qualityGrade: 'oem'
  };

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* Breadcrumb Bar */}
      <div style={{ backgroundColor: '#EEEEEE', borderBottom: '1px solid #DDDDDD', padding: '10px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666666' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, color: '#E53935', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={14} /> Back to Catalog
            </button>
            <span>/</span>
            <span>Braking Systems</span>
            <span>/</span>
            <span>Brake Kits & Calipers</span>
            <span>/</span>
            <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', backgroundColor: '#ffffff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #DDDDDD', color: '#1A1A1A' }}>
              <ShieldCheck size={14} color="#E53935" /> OEM AUTHENTICATED
            </span>
            <button style={{ background: 'none', border: 'none', color: '#666666', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Share2 size={13} /> Share Part
            </button>
            <button style={{ background: 'none', border: 'none', color: '#666666', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bookmark size={13} /> Save to Garage
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Hero Showcase */}
      <div style={{ maxWidth: '1240px', margin: '24px auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '32px' }}>
          
          {/* LEFT: Media Showcase */}
          <div>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              {/* Badges on Top Left */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
                <span style={{ backgroundColor: '#E53935', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  100% Genuine OEM
                </span>
                <span style={{ backgroundColor: '#FF6600', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Bestseller
                </span>
                <span style={{ backgroundColor: '#111111', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#25D366' }}></span>
                  In Stock - Riyadh Central Hub
                </span>
              </div>

              {/* Main Image Display */}
              <div style={{
                height: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#F9F9F9',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={images[activeImgIndex] || images[0]}
                  alt={title}
                  style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '16px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '32px',
                  color: 'rgba(0,0,0,0.08)',
                  userSelect: 'none'
                }}>
                  BREMBO GT
                </div>
              </div>

              {/* Spec Pills below image */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
                <div style={{ backgroundColor: '#F5F5F5', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>Disc Diameter</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', marginTop: '2px' }}>380 x 34 mm</div>
                </div>
                <div style={{ backgroundColor: '#F5F5F5', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>Piston Layout</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', marginTop: '2px' }}>6-Piston Monobloc</div>
                </div>
                <div style={{ backgroundColor: '#F5F5F5', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase', fontWeight: 600 }}>Assembly Origin</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', marginTop: '2px' }}>Italy (Original)</div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '12px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  style={{
                    height: '76px',
                    backgroundColor: '#ffffff',
                    border: activeImgIndex === idx ? '2px solid #E53935' : '1px solid #E0E0E0',
                    borderRadius: '8px',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border 0.2s'
                  }}
                >
                  <img src={img} alt="thumb" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>

            {/* Trust Warranty Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              backgroundColor: '#ffffff',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #E0E0E0',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="#E53935" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1A1A1A' }}>2-Yr Warranty</div>
                  <div style={{ fontSize: '10px', color: '#777777' }}>Direct Official</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} color="#E53935" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1A1A1A' }}>Exact Fit</div>
                  <div style={{ fontSize: '10px', color: '#777777' }}>100% Guaranteed</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={22} color="#E53935" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1A1A1A' }}>Express Delivery</div>
                  <div style={{ fontSize: '10px', color: '#777777' }}>Next-day Riyadh</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={22} color="#E53935" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1A1A1A' }}>Fitting Hubs</div>
                  <div style={{ fontSize: '10px', color: '#777777' }}>Riyadh & Jeddah</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Purchase Decision Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              {/* Brand and Subtitle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: '#E53935', color: '#ffffff', fontSize: '11px', fontWeight: 900, padding: '2px 6px', borderRadius: '3px' }}>
                    BREMBO
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#666666', textTransform: 'uppercase' }}>
                    Gran Turismo High-Performance Line
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#25D366' }}></span>
                  Ready for Dispatch
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', lineHeight: '28px', margin: '0 0 10px 0' }}>
                {title}
              </h1>

              {/* Part Numbers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#777777', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span>Part #: <strong style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>{partNumber}</strong></span>
                <span>•</span>
                <span>OEM Ref: <strong style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>43512-60200</strong></span>
                <span>•</span>
                <span>SKU: <strong style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>SP-BR-9842</strong></span>
              </div>

              {/* Reviews & Fit Questions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #EEEEEE', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F5A623' }}>
                  <Star size={15} fill="#F5A623" />
                  <Star size={15} fill="#F5A623" />
                  <Star size={15} fill="#F5A623" />
                  <Star size={15} fill="#F5A623" />
                  <Star size={15} fill="#F5A623" />
                  <span style={{ fontWeight: 800, color: '#1A1A1A', marginLeft: '4px' }}>4.9</span>
                </div>
                <span style={{ color: '#E53935', textDecoration: 'underline' }}>(128 customer reviews)</span>
                <span>•</span>
                <span style={{ color: '#666666', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <HelpCircle size={13} /> 42 answered fit questions
                </span>
              </div>

              {/* Price Block */}
              <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 700, color: '#E53935' }}>
                    SAR {price.toLocaleString()}.00
                  </span>
                  <span style={{ fontSize: '16px', textDecoration: 'line-through', color: '#999999' }}>
                    SAR {originalPrice.toLocaleString()}.00
                  </span>
                  <span style={{ backgroundColor: 'rgba(229,57,53,0.1)', color: '#E53935', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                    SAVE 10% (SAR 560.00)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666666', marginTop: '6px' }}>
                  <span>Price includes 15% KSA VAT & Customs Duties</span>
                  <span style={{ color: '#E53935', fontWeight: 700 }}>Free Doorstep Delivery in KSA</span>
                </div>

                {/* Installments (Tabby & Tamara) */}
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #E0E0E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: '#111111', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', fontWeight: 800, fontSize: '10px' }}>T4</span>
                    <div>
                      <strong>Split in 4 payments</strong> of <strong style={{ color: '#E53935' }}>SAR {(price / 4).toFixed(2)}/mo</strong>
                      <span style={{ display: 'block', color: '#777777', fontSize: '10px' }}>No interest, Sharia-compliant with Tamara or Tabby</span>
                    </div>
                  </div>
                  <span style={{ color: '#1A5276', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Learn More</span>
                </div>
              </div>

              {/* Vehicle Fitment Verification Card */}
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Vehicle Fitment Verification
                  </span>
                  <span style={{ fontSize: '10px', color: '#777777' }}>Live Database Sync</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#777777', textTransform: 'uppercase', marginBottom: '2px' }}>Make</label>
                    <select
                      value={vMake}
                      onChange={(e) => setVMake(e.target.value)}
                      style={{ width: '100%', height: '34px', fontSize: '11px', padding: '0 8px', borderRadius: '4px', border: '1px solid #DDDDDD' }}
                    >
                      <option value="toyota">Toyota</option>
                      <option value="lexus">Lexus</option>
                      <option value="nissan">Nissan</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#777777', textTransform: 'uppercase', marginBottom: '2px' }}>Model</label>
                    <select
                      value={vModel}
                      onChange={(e) => setVModel(e.target.value)}
                      style={{ width: '100%', height: '34px', fontSize: '11px', padding: '0 8px', borderRadius: '4px', border: '1px solid #DDDDDD' }}
                    >
                      <option value="lc300">Land Cruiser LC300</option>
                      <option value="sequoia">Sequoia</option>
                      <option value="tundra">Tundra</option>
                      <option value="patrol">Patrol Y62</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#777777', textTransform: 'uppercase', marginBottom: '2px' }}>Year</label>
                    <select
                      value={vYear}
                      onChange={(e) => setVYear(e.target.value)}
                      style={{ width: '100%', height: '34px', fontSize: '11px', padding: '0 8px', borderRadius: '4px', border: '1px solid #DDDDDD' }}
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#777777', textTransform: 'uppercase', marginBottom: '2px' }}>Trim & Engine</label>
                    <select
                      value={vTrim}
                      onChange={(e) => setVTrim(e.target.value)}
                      style={{ width: '100%', height: '34px', fontSize: '11px', padding: '0 8px', borderRadius: '4px', border: '1px solid #DDDDDD' }}
                    >
                      <option value="gr-sport">GR Sport 3.5L Twin-Turbo V6</option>
                      <option value="zx">ZX 3.5L Twin-Turbo V6</option>
                      <option value="vxr">VXR 3.5L V6</option>
                      <option value="gx-r">GXR 4.0L V6</option>
                    </select>
                  </div>
                </div>

                {/* Fit result */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  backgroundColor: vModel === 'patrol' ? 'rgba(26, 82, 118, 0.1)' : 'rgba(37, 211, 102, 0.1)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '11px'
                }}>
                  <CheckCircle2 size={16} color={vModel === 'patrol' ? '#1A5276' : '#25D366'} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: vModel === 'patrol' ? '#1A5276' : '#25D366' }}>
                      {vModel === 'patrol' ? 'VERIFIED COMPATIBLE:' : 'GUARANTEED EXACT FIT:'}
                    </strong>{' '}
                    <span>
                      {vModel === 'patrol'
                        ? 'Nissan Patrol Y62 (5.6L V8). Adapter bracket kit included in this package (SKU: BR-AD-Y62).'
                        : '2022-2025 Toyota / Lexus Platform (LC300 / Sequoia / LX600). Direct OEM bolt-on knuckle, requires 20"+ wheels.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Quantity Stepper */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F5F5F5',
                    borderRadius: '6px',
                    height: '44px',
                    padding: '0 6px',
                    border: '1px solid #DDDDDD'
                  }}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ background: 'none', border: 'none', width: '28px', height: '28px', fontWeight: 800, cursor: 'pointer', fontSize: '15px' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      readOnly
                      style={{ width: '36px', textAlign: 'center', border: 'none', background: 'none', fontWeight: 800, fontSize: '14px' }}
                    />
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      style={{ background: 'none', border: 'none', width: '28px', height: '28px', fontWeight: 800, cursor: 'pointer', fontSize: '15px' }}
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={() => onAddToCart(defaultPartObject)}
                    style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: '#E53935',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    <ShoppingCart size={16} />
                    <span>ADD TO CART • SAR {(price * quantity).toLocaleString()}.00</span>
                  </button>
                </div>

                {/* Instant 1-Click Checkout */}
                <button
                  onClick={() => onAddToCart(defaultPartObject)}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#111111',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  BUY NOW WITH 1-CLICK
                </button>

                {/* Ask Tech on WhatsApp */}
                <a
                  href="https://wa.me/9668001249900"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Ask Certified Brembo Technician on WhatsApp (Instant VIN Check)</span>
                </a>
              </div>

              {/* Delivery notice */}
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#666666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Order within <strong style={{ color: '#1A1A1A' }}>2 hrs 45 mins</strong> to receive <strong style={{ color: '#1A1A1A' }}>Tomorrow</strong> in Riyadh or Jeddah.</div>
                <div>Professional garage fitting available at <strong style={{ color: '#1A5276' }}>AUTOPARTS Partner Centers</strong> across KSA.</div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Interactive Tabs (Fitment Table, Specs, What's in the Box, Warranty)
            ========================================================================= */}
        <div style={{ marginTop: '36px' }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E0E0E0', paddingBottom: '2px', overflowX: 'auto' }}>
            {[
              { id: 'fitment', label: 'Vehicle Fitment Table (Guaranteed)' },
              { id: 'specs', label: 'Technical Specifications' },
              { id: 'box', label: "What's In The Box" },
              { id: 'warranty', label: 'Installation & Warranty' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: activeTab === tab.id ? '#E53935' : '#ffffff',
                  color: activeTab === tab.id ? '#ffffff' : '#1A1A1A',
                  border: '1px solid #DDDDDD',
                  borderRadius: '6px 6px 0 0',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panes */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0 0 10px 10px', border: '1px solid #DDDDDD', borderTop: 'none', padding: '24px' }}>
            
            {/* TAB 1: Fitment Table */}
            {activeTab === 'fitment' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1A1A1A' }}>
                      Verified Fitment Database & Compatibility Matrix
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666666' }}>
                      Every chassis listed below is covered by the AUTOPARTS 100% Fit-or-Refund Guarantee.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['all', 'toyota', 'lexus', 'nissan'].map(b => (
                        <button
                          key={b}
                          onClick={() => setFilterBrand(b)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: filterBrand === b ? '#111111' : '#F0F0F0',
                            color: filterBrand === b ? '#ffffff' : '#333333',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            cursor: 'pointer'
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Filter chassis or engine..."
                      value={searchTableQuery}
                      onChange={(e) => setSearchTableQuery(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #DDDDDD', borderRadius: '4px', width: '180px' }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F5F5F5', color: '#1A1A1A', borderBottom: '1px solid #E0E0E0' }}>
                        <th style={{ padding: '8px 12px' }}>Make & Model</th>
                        <th style={{ padding: '8px 12px' }}>Chassis Code</th>
                        <th style={{ padding: '8px 12px' }}>Years</th>
                        <th style={{ padding: '8px 12px' }}>Engine / Variant</th>
                        <th style={{ padding: '8px 12px' }}>Position</th>
                        <th style={{ padding: '8px 12px' }}>Fitment Notes</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Fit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFitment.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #EEEEEE' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{row.model}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{row.chassis}</td>
                          <td style={{ padding: '8px 12px' }}>{row.years}</td>
                          <td style={{ padding: '8px 12px' }}>{row.engine}</td>
                          <td style={{ padding: '8px 12px' }}>{row.pos}</td>
                          <td style={{ padding: '8px 12px', color: '#666666' }}>{row.notes}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Technical Specifications */}
            {activeTab === 'specs' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, borderBottom: '1px solid #EEEEEE', paddingBottom: '6px' }}>
                    Caliper & Hydraulic Engineering
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Caliper Architecture</span>
                      <strong>6-Piston Monobloc (Machined Cast Aluminum Alloy)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Piston Configuration</span>
                      <strong>Differential Bore Sizes (30mm / 34mm / 38mm)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Finish & Coating</span>
                      <strong>High-Temp Epoxy Anodized Red with Embossed Script</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Recommended Brake Fluid</span>
                      <strong style={{ color: '#E53935' }}>DOT 5.1 High-Temp Racing Synthetic (Min Dry BP 270°C)</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, borderBottom: '1px solid #EEEEEE', paddingBottom: '6px' }}>
                    Rotors, Compounds & Hardware
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Rotor Dimensions</span>
                      <strong>380mm Outer Diameter x 34mm Thickness</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Rotor Construction</span>
                      <strong>2-Piece Floating Disc with 48 Curved Directional Vanes</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Center Bell Material</span>
                      <strong>CNC Machined 6061-T6 Billet Aluminum (Hard Anodized Charcoal)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '4px' }}>
                      <span style={{ color: '#777777' }}>Origin & Certification</span>
                      <strong>Curno, Italy (TUV Approved)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: What's in the Box */}
            {activeTab === 'box' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { num: '01', title: '2x Monobloc Calipers', desc: 'Pair of authentic Brembo GT 6-piston front calipers in gloss Rosso Corsa.' },
                  { num: '02', title: '2x 380mm Floating Rotors', desc: 'Pre-assembled 2-piece drilled brake rotors with aircraft-grade aluminum bells.' },
                  { num: '03', title: 'Axle Brake Pad Set', desc: 'Complete 4-pad Brembo FM1000 ceramic street compound with anti-squeal shims.' },
                  { num: '04', title: 'Braided Steel Lines', desc: 'Pair of Teflon-lined, stainless steel braided front brake lines with DOT compliance stamps.' },
                  { num: '05', title: 'Brackets & Hardware', desc: 'CNC alloy caliper carriers, Grade 10.9 cadmium-plated mounting bolts and washers.' },
                  { num: '06', title: 'Security Certificate', desc: 'Official Brembo hologram warranty card, QR registration, and torque guide.' },
                ].map(item => (
                  <div key={item.num} style={{ backgroundColor: '#F9F9F9', padding: '16px', borderRadius: '8px', border: '1px solid #EEEEEE' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#E53935', marginBottom: '4px' }}>{item.num}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Installation & Warranty */}
            {activeTab === 'warranty' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800 }}>Installation Guidance</h4>
                  <p style={{ fontSize: '11.5px', color: '#666666', lineHeight: '18px' }}>
                    This big brake system is engineered as a direct replacement for your front OEM setup. Expected installation time is 2.0 - 2.5 hours by an ASE-certified technician.
                  </p>
                  <div style={{ backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '6px', fontSize: '11px', marginTop: '10px' }}>
                    <div style={{ fontWeight: 800, color: '#E53935', marginBottom: '4px' }}>Recommended Torque Specs:</div>
                    <div>• Caliper Carrier to Spindle Bolts: <strong>115 Nm (85 lb-ft)</strong></div>
                    <div>• Caliper to Carrier Radial Stud Nuts: <strong>80 Nm (59 lb-ft)</strong></div>
                    <div>• Banjo Bolt to Caliper Body: <strong>28 Nm (21 lb-ft)</strong></div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800 }}>AUTOPARTS Official 24-Month Warranty</h4>
                  <p style={{ fontSize: '11.5px', color: '#666666', lineHeight: '18px' }}>
                    AUTOPARTS is an authorized distributor of Brembo S.p.A. in the Kingdom of Saudi Arabia. Every kit includes a unique serialized code verifiable on the Brembo Check mobile application.
                  </p>
                  <ul style={{ paddingLeft: '16px', margin: '8px 0', fontSize: '11.5px', color: '#333333' }}>
                    <li>Full coverage against caliper seal leakage & hydraulic failure for 24 months.</li>
                    <li>Rotor casting integrity and structural warping guarantee.</li>
                    <li>Free doorstep exchange in Saudi Arabia for manufacturing defects.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            FAQ Accordion Section
            ========================================================================= */}
        <div style={{ marginTop: '36px' }}>
          <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#1A1A1A', marginBottom: '16px' }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '800px', margin: '0 auto' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{faq.q}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#E53935' }}>{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '11.5px', color: '#666666', lineHeight: '18px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Action Micro-Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111111',
        borderTop: '2px solid #E53935',
        padding: '10px 24px',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={images[0]} alt="mini" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '4px', padding: '2px' }} />
            <div style={{ color: '#ffffff' }}>
              <div style={{ fontSize: '12px', fontWeight: 800 }}>{title}</div>
              <div style={{ fontSize: '10px', color: '#999999' }}>Part # {partNumber} • Guaranteed Fit</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#E53935' }}>SAR {price.toLocaleString()}.00</div>
              <div style={{ fontSize: '10px', color: '#888888' }}>VAT & Free KSA Delivery</div>
            </div>
            <button
              onClick={() => onAddToCart(defaultPartObject)}
              style={{
                backgroundColor: '#E53935',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShoppingCart size={15} /> ADD TO CART
            </button>
            <a
              href="https://wa.me/9668001249900"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              <MessageSquare size={18} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};
