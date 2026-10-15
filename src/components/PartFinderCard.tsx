import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Search, Car, CheckCircle2, ArrowRight } from 'lucide-react';

interface PartFinderCardProps {
  lang: 'en' | 'ar';
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle | null) => void;
  onSearchQuery: (query: string) => void;
}

export const PartFinderCard: React.FC<PartFinderCardProps> = ({
  lang,
  selectedVehicle,
  onSelectVehicle,
  onSearchQuery
}) => {
  const [tab, setTab] = useState<'vehicle' | 'number'>('vehicle');
  const [partInput, setPartInput] = useState('');
  
  // Quick vehicle state
  const [make, setMake] = useState(selectedVehicle?.make || 'Toyota');
  const [model, setModel] = useState(selectedVehicle?.model || 'Camry');
  const [year, setYear] = useState<number>(selectedVehicle?.year || 2022);

  const handleApplyVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectVehicle({ make, model, year });
    const el = document.getElementById('catalog-products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQuery(partInput);
    const el = document.getElementById('catalog-products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      maxWidth: 'var(--container)',
      margin: '0 auto 40px auto',
      padding: '0 24px'
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: 'var(--r-3xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Card Header with Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)'
        }}>
          <button
            onClick={() => setTab('vehicle')}
            style={{
              padding: '16px 28px',
              border: 'none',
              background: tab === 'vehicle' ? 'var(--white)' : 'transparent',
              color: tab === 'vehicle' ? 'var(--primary)' : 'var(--text-sub)',
              fontFamily: 'var(--font-ui)',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderTop: tab === 'vehicle' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Car size={18} />
            <span>{lang === 'ar' ? 'البحث بمطابقة المركبة' : 'Search by Vehicle'}</span>
          </button>

          <button
            onClick={() => setTab('number')}
            style={{
              padding: '16px 28px',
              border: 'none',
              background: tab === 'number' ? 'var(--white)' : 'transparent',
              color: tab === 'number' ? 'var(--primary)' : 'var(--text-sub)',
              fontFamily: 'var(--font-ui)',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderTop: tab === 'number' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={18} />
            <span>{lang === 'ar' ? 'البحث برقم القطعة أو الهيكل' : 'Search by Part / OEM #'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px 30px' }}>
          {tab === 'vehicle' ? (
            <form onSubmit={handleApplyVehicle} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
              gap: '16px',
              alignItems: 'flex-end'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-strong)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الصانع' : '1. Select Make'}
                </label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    padding: '0 14px',
                    backgroundColor: 'var(--surface-input)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="Toyota">Toyota (تويوتا)</option>
                  <option value="Lexus">Lexus (لكزس)</option>
                  <option value="Hyundai">Hyundai (هيونداي)</option>
                  <option value="Kia">Kia (كيا)</option>
                  <option value="Nissan">Nissan (نيسان)</option>
                  <option value="Ford">Ford (فورد)</option>
                  <option value="Chevrolet">Chevrolet (شفروليه)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-strong)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الموديل' : '2. Select Model'}
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    padding: '0 14px',
                    backgroundColor: 'var(--surface-input)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="Camry">Camry (كامري)</option>
                  <option value="Corolla">Corolla (كورولا)</option>
                  <option value="Land Cruiser">Land Cruiser (لاندكروزر)</option>
                  <option value="Hilux">Hilux (هايلكس)</option>
                  <option value="Yaris">Yaris (يارس)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-strong)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'سنة الصنع' : '3. Select Year'}
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    padding: '0 14px',
                    backgroundColor: 'var(--surface-input)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '44px', padding: '0 28px', width: '100%' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === 'ar' ? 'تطبيق المطابقة' : 'FIND PARTS'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePartSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={partInput}
                onChange={(e) => setPartInput(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل رقم القطعة، OEM، أو كود الهيكل VIN...' : 'Enter Part Number, OEM reference (e.g. 04465-33471), or VIN...'}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  padding: '0 16px',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface-input)',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ height: '44px', padding: '0 28px' }}
              >
                <Search size={16} />
                <span>{lang === 'ar' ? 'بحث موثق' : 'SEARCH'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
