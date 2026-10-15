import React from 'react';
import { PartCategory } from '../types';
import { ArrowUpRight, Layers } from 'lucide-react';

interface FeaturedCategoriesSectionProps {
  categories: PartCategory[];
  onSelectCategory: (category: PartCategory) => void;
  lang: 'en' | 'ar';
}

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  'brakes': 'https://images.unsplash.com/photo-1600790142055-619df03207e6?w=600&q=80',
  'engine-parts': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80',
  'lighting': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&q=80',
  'suspension': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80',
  'cooling': 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80',
  'body-parts': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
  'transmission': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80',
  'electrical': 'https://images.unsplash.com/photo-1558441719-79848520ed4e?w=600&q=80'
};

export const FeaturedCategoriesSection: React.FC<FeaturedCategoriesSectionProps> = ({
  categories,
  onSelectCategory,
  lang,
}) => {
  return (
    <section style={{ maxWidth: 'var(--container-wide)', margin: '0 auto 40px auto', padding: '0 24px' }}>
      
      {/* Section Header: Bebas H2 left with 60x4 #E8571F bar above; BROWSE OUR COLLECTION small caps right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-accent-bar section-accent-orange" />
          <h2 style={{
            fontSize: '42px',
            lineHeight: '42px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--text-strong)',
            margin: 0
          }}>
            {lang === 'ar' ? 'أقسام وقطع الغيار المميزة' : 'FEATURED CATEGORIES'}
          </h2>
        </div>

        <div style={{
          fontSize: '14px',
          lineHeight: '21px',
          fontWeight: 500,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)'
        }}>
          {lang === 'ar' ? 'تصفح تشكيلتنا الشاملة' : 'BROWSE OUR COLLECTION'}
        </div>
      </div>

      {/* 4-column Grid: cards 296 x 257, #1A1A1A, radius 16, background image with dark gradient */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {categories.slice(0, 8).map(cat => {
          const bgImg = CATEGORY_BACKGROUNDS[cat.slug] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80';
          
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              style={{
                height: '257px',
                borderRadius: 'var(--r-3xl)',
                backgroundColor: 'var(--ink-800)',
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)'
              }}
              className="hover-lift"
            >
              {/* Dark overlay: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.1) 35%, rgba(0,0,0,.85) 100%) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.88) 100%)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {/* Top: 44px icon box (radius 12, white 8% fill) */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--r-xl)',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--white)'
                }}>
                  <Layers size={22} />
                </div>

                {/* Bottom: title (Bebas 22) + count ("1194+ Products") + 32px round arrow button */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      fontSize: '22px',
                      lineHeight: '24.2px',
                      fontWeight: 400,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      color: 'var(--white)',
                      marginBottom: '4px'
                    }}>
                      {lang === 'ar' ? cat.nameAr : cat.nameEn}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      lineHeight: '18px',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      color: 'rgba(255, 255, 255, 0.65)'
                    }}>
                      {lang === 'ar' ? '120+ قطعة معتمدة' : '150+ Verified Parts'}
                    </div>
                  </div>

                  {/* 32px round arrow */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
