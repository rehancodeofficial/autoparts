import React from 'react';
import { ChevronLeft, ChevronRight, Zap, ShieldCheck, Truck, Wrench, Sparkles } from 'lucide-react';

interface QuickLinkItem {
  id: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  imageUrl: string;
  categorySlug: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    id: '1',
    title: 'BRAKE PADS & ROTORS',
    titleAr: 'فحمات وهوبات الفرامل',
    desc: 'Ceramic & semi-metallic OEM grade stopping power',
    descAr: 'فحمات سيراميك معتمدة لأعلى درجات الأمان',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?w=400&q=80',
    categorySlug: 'brakes'
  },
  {
    id: '2',
    title: 'ENGINE OIL & FILTERS',
    titleAr: 'زيوت وفلاتر المحرك',
    desc: 'Synthetic lubricants and multi-tier filter elements',
    descAr: 'زيوت تخليقية بالكامل وفلاتر زيت وهواء',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
    categorySlug: 'engine-parts'
  },
  {
    id: '3',
    title: 'LED LIGHTING & HEADLAMPS',
    titleAr: 'إضاءة وليدات أمامية وخلفية',
    desc: 'Crystal optical headlights and ambient fog units',
    descAr: 'شمعات ليد فائقة السطوع ومطابقة للمواصفات',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&q=80',
    categorySlug: 'lighting'
  },
  {
    id: '4',
    title: 'SUSPENSION & SHOCKS',
    titleAr: 'مساعدات ونظام التعليق',
    desc: 'Gas-charged struts and stabilizer control links',
    descAr: 'مساعدات غازية ويايات ومقصات قيادة ناعمة',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&q=80',
    categorySlug: 'suspension'
  },
  {
    id: '5',
    title: 'COOLING RADIATORS',
    titleAr: 'راديتر ومراوح التبريد',
    desc: 'Aluminum heat exchangers and electric thermostats',
    descAr: 'راديترات ألمنيوم عالية الكفاءة لصيف الخليج',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',
    categorySlug: 'cooling'
  }
];

interface QuickLinkCarouselProps {
  lang: 'en' | 'ar';
  onSelectCategory: (slug: string) => void;
}

export const QuickLinkCarousel: React.FC<QuickLinkCarouselProps> = ({ lang, onSelectCategory }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      maxWidth: 'var(--container)',
      margin: '-50px auto 30px auto', // Overlaps the bottom of the hero
      padding: '0 24px',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ position: 'relative' }}>
        
        {/* Left Arrow Button (40px, #E53935 round arrow with shadow) */}
        <button
          onClick={() => scroll(lang === 'ar' ? 'right' : 'left')}
          style={{
            position: 'absolute',
            top: '50%',
            left: lang === 'en' ? '-16px' : 'auto',
            right: lang === 'ar' ? '-16px' : 'auto',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'var(--white)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-arrow)',
            zIndex: 2,
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          className="hover:scale-105"
        >
          {lang === 'ar' ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {QUICK_LINKS.map(item => (
            <div
              key={item.id}
              onClick={() => onSelectCategory(item.categorySlug)}
              style={{
                minWidth: '220px',
                width: '220px',
                height: '232px',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              className="hover-lift"
            >
              {/* Text Area (top) */}
              <div style={{ padding: '14px 14px 10px 14px', flexShrink: 0 }}>
                <div style={{
                  fontSize: '13px',
                  lineHeight: '16.9px',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: 'var(--text-strong)',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {lang === 'ar' ? item.titleAr : item.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  lineHeight: '16.8px',
                  color: 'var(--text-sub)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '34px'
                }}>
                  {lang === 'ar' ? item.descAr : item.desc}
                </div>
              </div>

              {/* Image Area (150px tall) */}
              <div style={{ height: '150px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--surface-alt)' }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  className="hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow Button (40px, #E53935 round arrow with shadow) */}
        <button
          onClick={() => scroll(lang === 'ar' ? 'left' : 'right')}
          style={{
            position: 'absolute',
            top: '50%',
            right: lang === 'en' ? '-16px' : 'auto',
            left: lang === 'ar' ? '-16px' : 'auto',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'var(--white)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-arrow)',
            zIndex: 2,
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          className="hover:scale-105"
        >
          {lang === 'ar' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>

      </div>
    </div>
  );
};
