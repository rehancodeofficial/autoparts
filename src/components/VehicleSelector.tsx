import React, { useState } from 'react';
import { Vehicle } from '../types';
import { POPULAR_VEHICLES, YEARS } from '../data/mockData';
import { Car, ChevronDown, Check, X } from 'lucide-react';

interface VehicleSelectorProps {
  currentVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  lang: 'en' | 'ar';
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  currentVehicle,
  onSelectVehicle,
  lang
}) => {
  const [selectedMake, setSelectedMake] = useState<string>(currentVehicle?.make || '');
  const [selectedModel, setSelectedModel] = useState<string>(currentVehicle?.model || '');
  const [selectedYear, setSelectedYear] = useState<number | ''>(currentVehicle?.year || '');
  const [isOpen, setIsOpen] = useState(false);

  const availableModels = POPULAR_VEHICLES.find(v => v.make === selectedMake)?.models || [];

  const handleApply = () => {
    if (selectedMake && selectedModel && selectedYear) {
      onSelectVehicle({
        make: selectedMake,
        model: selectedModel,
        year: Number(selectedYear)
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    onSelectVehicle(null);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="shop-pill"
        style={{
          border: currentVehicle ? '1.5px solid #000000' : '1px solid var(--color-faint-border)',
          background: '#ffffff',
          padding: '8px 16px',
          height: '44px'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: '#f2f4f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Car size={14} color="#000000" />
        </div>

        <div style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
          {currentVehicle ? (
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#000000' }}>
              {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: '#787574' }}>
              {lang === 'ar' ? 'حدد سيارتك' : 'Select vehicle'}
            </span>
          )}
        </div>

        <ChevronDown size={14} color="#787574" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Pill Modal Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: lang === 'en' ? 0 : 'auto',
            left: lang === 'ar' ? 0 : 'auto',
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid var(--color-faint-border)',
            padding: '24px',
            zIndex: 200
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', letterSpacing: '-0.025em' }}>
              {lang === 'ar' ? 'مرآب سيارتك' : 'Your Vehicle Garage'}
            </h4>
            {currentVehicle && (
              <button
                onClick={handleClear}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  color: '#787574',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} />
                {lang === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Make */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                {lang === 'ar' ? 'المصنع' : 'Make'}
              </label>
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الشركة...' : 'Choose Make...'}</option>
                {POPULAR_VEHICLES.map(v => (
                  <option key={v.make} value={v.make}>{v.make}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                {lang === 'ar' ? 'الموديل' : 'Model'}
              </label>
              <select
                value={selectedModel}
                disabled={!selectedMake}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الموديل...' : 'Choose Model...'}</option>
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                {lang === 'ar' ? 'السنة' : 'Year'}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر السنة...' : 'Choose Year...'}</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-shop-pill"
              style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedMake || !selectedModel || !selectedYear}
              className="btn-shop-primary"
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                opacity: (!selectedMake || !selectedModel || !selectedYear) ? 0.4 : 1
              }}
            >
              <Check size={14} />
              <span>{lang === 'ar' ? 'تأكيد' : 'Confirm'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
