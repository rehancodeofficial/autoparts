import React from 'react';
import { Flame, ArrowRight, Tag } from 'lucide-react';

interface FeaturedDealsSectionProps {
  lang: 'en' | 'ar';
  onExploreDeals: () => void;
}

export const FeaturedDealsSection: React.FC<FeaturedDealsSectionProps> = ({ lang, onExploreDeals }) => {
  const deals = [
    {
      id: '1',
      bg: 'var(--deal-blue)',
      badge: 'TRENDING',
      price: '185 SAR',
      oldPrice: '260 SAR',
      title: 'Brembo Ceramic Front Brake Pad Set',
      titleAr: 'طقم فحمات بريمبو سيراميك أمامية',
      image: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?w=300&q=80'
    },
    {
      id: '2',
      bg: '#1E4038',
      badge: 'HOT DEAL',
      price: '95 SAR',
      oldPrice: '140 SAR',
      title: 'Bosch High-Performance Oil Filter Kit',
      titleAr: 'فلتر زيت بوش ألماني فائق الفلترة',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&q=80'
    },
    {
      id: '3',
      bg: '#4A235A',
      badge: 'LIMITED',
      price: '340 SAR',
      oldPrice: '480 SAR',
      title: 'Philips DiamondVision LED H4 Headlamp',
      titleAr: 'شمعات ليد فيليبس دايموند أصلية',
      image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80'
    }
  ];

  return (
    <section style={{ backgroundColor: 'var(--surface-alt)', padding: '40px 0', marginBottom: '40px' }}>
      <div style={{ maxWidth: 'var(--container-wide)', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div className="section-accent-bar" />
            <h2 style={{
              fontSize: '28px',
              lineHeight: '33.6px',
              fontWeight: 900,
              fontFamily: 'var(--font-title)',
              textTransform: 'uppercase',
              color: 'var(--text-strong)',
              margin: 0
            }}>
              {lang === 'ar' ? 'عروض وخصومات مميزة' : 'FEATURED DEALS'}
            </h2>
          </div>

          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            textTransform: 'uppercase'
          }}>
            {lang === 'ar' ? 'وفر حتى 35% على القطع الأصلية' : 'UP TO 35% OFF OEM ESSENTIALS'}
          </div>
        </div>

        {/* 3 Col Grid: cards 453x160, radius 6, amber badge, big price 28/900 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {deals.map(deal => (
            <div
              key={deal.id}
              onClick={onExploreDeals}
              style={{
                height: '160px',
                backgroundColor: deal.bg,
                borderRadius: 'var(--r-md)',
                display: 'flex',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)'
              }}
              className="hover-lift"
            >
              {/* Text half (padding 18px 16px) */}
              <div style={{
                flex: 1,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{
                    backgroundColor: 'var(--amber)',
                    color: '#1A1A1A',
                    borderRadius: 'var(--r-xs)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    {deal.badge}
                  </span>

                  <div style={{
                    fontSize: '13px',
                    lineHeight: '1.3',
                    color: 'var(--white)',
                    fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {lang === 'ar' ? deal.titleAr : deal.title}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 900,
                      color: 'var(--white)',
                      fontFamily: 'var(--font-content)'
                    }}>
                      {deal.price}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      textDecoration: 'line-through'
                    }}>
                      {deal.oldPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image half */}
              <div style={{ width: '140px', position: 'relative' }}>
                <img
                  src={deal.image}
                  alt={deal.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
