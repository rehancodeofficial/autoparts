import React from 'react';
import { PartCategory } from '../types';
import { Layers, ChevronRight } from 'lucide-react';

interface CategoryGridProps {
  categories: PartCategory[];
  selectedCategoryId?: string;
  onSelectCategory: (category: PartCategory) => void;
  lang: 'en' | 'ar';
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  lang,
}) => {
  return (
    <section style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '28px', 
              height: '28px', 
              borderRadius: '8px', 
              backgroundColor: '#5433eb', 
              color: '#ffffff' 
            }}>
              <Layers size={16} />
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.03em', color: '#000000', margin: 0 }}>
              {lang === 'ar' ? 'تسوق قطع الغيار حسب التصنيف' : 'Shop Parts by Category'}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#787574', marginTop: '4px', marginBottom: 0 }}>
            {lang === 'ar'
              ? 'تصفح الأنظمة والمكونات: الإضاءة، الفرامل، الهيكل، المحرك، والتبريد'
              : 'Explore auto systems: Headlights, Braking, Body panels, Engine, Cooling and Filters'}
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="shop-card" style={{ padding: '32px', textAlign: 'center', color: '#787574' }}>
          {lang === 'ar' ? 'لا توجد تصنيفات منشورة حالياً' : 'No categories currently published'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '14px',
        }}>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                className="shop-card"
                style={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isSelected ? '#5433eb' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#000000',
                  border: isSelected ? '1.5px solid #5433eb' : '1px solid var(--color-faint-border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: lang === 'ar' ? 'right' : 'left',
                  transition: 'all 0.18s ease',
                  outline: 'none'
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: '#f2f4f5',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {cat.imageUrl ? (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.nameEn} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={20} color="#787574" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {lang === 'ar' ? cat.nameAr : cat.nameEn}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: isSelected ? '#e0d8ff' : '#787574', 
                    marginTop: '2px' 
                  }}>
                    {cat.productCount !== undefined && cat.productCount > 0
                      ? `${cat.productCount} ${lang === 'ar' ? 'قطعة متوفرة' : 'parts available'}`
                      : (lang === 'ar' ? 'عرض القطع' : 'Browse parts')}
                  </div>
                </div>

                <ChevronRight 
                  size={14} 
                  color={isSelected ? '#ffffff' : '#a8a8a8'} 
                  style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none', flexShrink: 0 }} 
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
