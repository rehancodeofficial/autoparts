import React from 'react';
import { VehicleMake } from '../types';
import { ChevronRight, ShieldCheck, Car } from 'lucide-react';

interface ManufacturerGridProps {
  makes: VehicleMake[];
  selectedMakeId?: string;
  onSelectMake: (make: VehicleMake) => void;
  lang: 'en' | 'ar';
}

export const ManufacturerGrid: React.FC<ManufacturerGridProps> = ({
  makes,
  selectedMakeId,
  onSelectMake,
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
              backgroundColor: '#000000', 
              color: '#ffffff' 
            }}>
              <Car size={16} />
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.03em', color: '#000000', margin: 0 }}>
              {lang === 'ar' ? 'تسوق قطع الغيار حسب صانع السيارة' : 'Shop Parts by Vehicle'}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#787574', marginTop: '4px', marginBottom: 0 }}>
            {lang === 'ar' 
              ? 'اختر الشركة المصنعة لعرض الموديلات المتوافقة والموثقة في قاعدة البيانات' 
              : 'Select vehicle manufacturer to inspect verified compatible models and genuine parts'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0d8239', fontWeight: '600' }}>
          <ShieldCheck size={16} />
          <span>{lang === 'ar' ? 'مطابقة معتمدة 100%' : '100% Fitment Guarantee'}</span>
        </div>
      </div>

      {makes.length === 0 ? (
        <div className="shop-card" style={{ padding: '32px', textAlign: 'center', color: '#787574' }}>
          {lang === 'ar' ? 'لا توجد شركات سيارات منشورة حالياً' : 'No vehicle manufacturers currently published'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
        }}>
          {makes.map((make) => {
            const isSelected = selectedMakeId === make.id;
            return (
              <button
                key={make.id}
                onClick={() => onSelectMake(make)}
                className="shop-card"
                style={{
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: isSelected ? '#000000' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#000000',
                  border: isSelected ? '1.5px solid #000000' : '1px solid var(--color-faint-border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  outline: 'none',
                  minHeight: '110px'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? '#222222' : '#f5f5f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '6px'
                }}>
                  {make.logoUrl ? (
                    <img 
                      src={make.logoUrl} 
                      alt={make.name} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <Car size={22} color={isSelected ? '#ffffff' : '#000000'} />
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-0.02em' }}>
                    {make.name}
                  </div>
                  {make.modelCount !== undefined && make.modelCount > 0 && (
                    <div style={{ fontSize: '11px', color: isSelected ? '#a8a8a8' : '#787574', marginTop: '2px' }}>
                      {make.modelCount} {lang === 'ar' ? 'موديلات' : 'models'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
