import React, { useState, useEffect } from 'react';
import { VehicleMake, VehicleModel, VehicleYear, Vehicle } from '../types';
import { ArrowLeft, Car, Check, ShieldCheck, ChevronRight } from 'lucide-react';

interface ManufacturerDetailPageProps {
  make: VehicleMake;
  onBack: () => void;
  onSelectVehicleAndBrowse: (vehicle: Vehicle) => void;
  lang: 'en' | 'ar';
}

export const ManufacturerDetailPage: React.FC<ManufacturerDetailPageProps> = ({
  make,
  onBack,
  onSelectVehicleAndBrowse,
  lang,
}) => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>('');

  useEffect(() => {
    async function loadModels() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vehicles/makes/${make.id}/models`);
        if (res.ok) {
          const data = await res.json();
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0]);
            if (data[0].years && data[0].years.length > 0) {
              setSelectedYear(data[0].years[0].year);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load models for make', e);
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, [make.id]);

  const handleModelChange = (model: VehicleModel) => {
    setSelectedModel(model);
    if (model.years && model.years.length > 0) {
      setSelectedYear(model.years[0].year);
    } else {
      setSelectedYear(null);
    }
    setSelectedEngine('');
  };

  const handleConfirmAndSearch = () => {
    if (!selectedModel || !selectedYear) return;
    onSelectVehicleAndBrowse({
      make: make.name,
      makeId: make.id,
      model: selectedModel.name,
      modelId: selectedModel.id,
      year: selectedYear,
      engine: selectedEngine || undefined,
    });
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          className="btn-shop-pill"
          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
          <span>{lang === 'ar' ? 'الرجوع للمصنعين' : 'All Manufacturers'}</span>
        </button>
        <span style={{ color: '#787574' }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#000000' }}>{make.name}</span>
      </div>

      {/* Header Banner */}
      <div className="shop-card" style={{
        padding: '28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f9f9fa 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-faint-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            {make.logoUrl ? (
              <img src={make.logoUrl} alt={make.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <Car size={32} color="#000000" />
            )}
          </div>

          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.04em', margin: 0, color: '#000000' }}>
              {make.name} {lang === 'ar' ? 'قطع الغيار الأصلية والبديلة' : 'Genuine & Aftermarket Parts'}
            </h1>
            <p style={{ fontSize: '13px', color: '#787574', marginTop: '6px', marginBottom: 0, maxWidth: '600px' }}>
              {make.description || (lang === 'ar' ? 'حدد الموديل وسنة الصنع لاستعراض القطع المطابقة لسيارتك بدقة.' : 'Select model, generation, and year to filter exact fitment verified auto parts.')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#e6f9ed', borderRadius: '9999px', color: '#0d8239', fontSize: '13px', fontWeight: '600' }}>
          <ShieldCheck size={18} />
          <span>{lang === 'ar' ? 'تطابق مضمون برقم الهيكل' : 'VIN Verified Fitments'}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#787574' }}>
          {lang === 'ar' ? 'جاري تحميل موديلات السيارات...' : 'Loading vehicle models...'}
        </div>
      ) : models.length === 0 ? (
        <div className="shop-card" style={{ padding: '48px', textAlign: 'center', color: '#787574' }}>
          <Car size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3>{lang === 'ar' ? 'لا توجد موديلات منشورة لهذه الشركة حالياً' : 'No models currently published for this manufacturer'}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px' }}>
          
          {/* Models Column */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.025em', marginBottom: '14px', color: '#000000' }}>
              1. {lang === 'ar' ? 'اختر الموديل' : 'Select Model'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {models.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModelChange(m)}
                    className="shop-card"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? '#000000' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#000000',
                      border: isSelected ? '1.5px solid #000000' : '1px solid var(--color-faint-border)',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      textAlign: lang === 'ar' ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{m.name}</div>
                      {m.generation && (
                        <div style={{ fontSize: '11px', color: isSelected ? '#a8a8a8' : '#787574', marginTop: '2px' }}>
                          {m.generation}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} color={isSelected ? '#ffffff' : '#787574'} style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Specification & Year Picker */}
          {selectedModel && (
            <div className="shop-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ebebeb', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.03em', margin: 0, color: '#000000' }}>
                    {make.name} {selectedModel.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#787574', marginTop: '4px' }}>
                    {lang === 'ar' ? 'حدد سنة الصنع وفئة المحرك لعرض القطع المطابقة' : 'Select model year and engine variant to load verified compatible parts'}
                  </div>
                </div>
              </div>

              {/* Year Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#000000', marginBottom: '10px' }}>
                  2. {lang === 'ar' ? 'سنة الصنع' : 'Model Year'}
                </label>
                {selectedModel.years && selectedModel.years.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedModel.years.map((y) => {
                      const isSelected = selectedYear === y.year;
                      return (
                        <button
                          key={y.id || y.year}
                          onClick={() => setSelectedYear(y.year)}
                          className={`shop-pill ${isSelected ? 'active' : ''}`}
                          style={{
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: isSelected ? '700' : '500',
                            backgroundColor: isSelected ? '#000000' : '#f5f5f7',
                            color: isSelected ? '#ffffff' : '#000000',
                            border: isSelected ? '1px solid #000000' : '1px solid transparent',
                            borderRadius: '9999px',
                            cursor: 'pointer'
                          }}
                        >
                          {y.year}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#787574' }}>
                    {lang === 'ar' ? 'جميع سنوات الموديل مشمولة' : 'All model years supported'}
                  </div>
                )}
              </div>

              {/* Engine Variant Option */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#000000', marginBottom: '8px' }}>
                  3. {lang === 'ar' ? 'نوع المحرك أو الفئة (اختياري)' : 'Engine or Trim Variant (Optional)'}
                </label>
                <input
                  type="text"
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: 2.5L 4-Cyl أو هايبرد أو V6' : 'e.g. 2.5L 4-Cylinder, Hybrid, or 3.5L V6'}
                  className="shop-input"
                  style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleConfirmAndSearch}
                disabled={!selectedYear}
                className="btn-shop-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: selectedYear ? 1 : 0.5
                }}
              >
                <Check size={16} />
                <span>
                  {lang === 'ar'
                    ? `عرض قطع غيار ${make.name} ${selectedModel.name} (${selectedYear || ''})`
                    : `Shop Compatible Parts for ${make.name} ${selectedModel.name} (${selectedYear || ''})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
