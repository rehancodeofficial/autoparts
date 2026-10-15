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
              borderRadius: '6px', 
              backgroundColor: '#d42b2b', 
              color: '#ffffff' 
            }}>
              <Car size={16} />
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: '#2b2d42', margin: 0 }}>
              {lang === 'ar' ? 'تسوق قطع الغيار حسب صانع السيارة' : 'Shop Parts by Vehicle'}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '4px', marginBottom: 0 }}>
            {lang === 'ar' 
              ? 'اختر الشركة المصنعة لعرض الموديلات المتوافقة والموثقة في قاعدة البيانات' 
              : 'Select vehicle manufacturer to inspect verified compatible models and genuine parts'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1a6b3c', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>
          <ShieldCheck size={16} />
          <span>{lang === 'ar' ? 'مطابقة معتمدة 100%' : '100% Fitment Guarantee'}</span>
        </div>
      </div>

      {makes.length === 0 ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#666666' }}>
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
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 12px',
                  backgroundColor: '#ffffff',
                  border: isSelected ? '2px solid #d42b2b' : '1px solid #e5e5e7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected ? '0 2px 8px rgba(212, 43, 43, 0.2)' : '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                {/* Logo Image */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  backgroundColor: '#f7f8f9',
                  borderRadius: '8px',
                  padding: '6px'
                }}>
                  {make.logoUrl ? (
                    <img
                      src={make.logoUrl}
                      alt={make.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Car size={24} color="#666666" />
                  )}
                </div>

                {/* Make Name */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-heading)',
                  color: isSelected ? '#d42b2b' : '#2b2d42',
                  marginBottom: '2px'
                }}>
                  {make.name}
                </div>

                {/* Country / Models Count Tag */}
                <div style={{ fontSize: '11px', color: '#666666' }}>
                  {make.country || 'Global'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
