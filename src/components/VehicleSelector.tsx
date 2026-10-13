import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleMake, VehicleModel } from '../types';
import { Car, ChevronDown, Check, X, ShieldCheck } from 'lucide-react';

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
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>(currentVehicle?.make || '');
  const [selectedMakeId, setSelectedMakeId] = useState<string>(currentVehicle?.makeId || '');
  const [selectedModel, setSelectedModel] = useState<string>(currentVehicle?.model || '');
  const [selectedModelId, setSelectedModelId] = useState<string>(currentVehicle?.modelId || '');
  const [selectedYear, setSelectedYear] = useState<number | ''>(currentVehicle?.year || '');
  const [selectedEngine, setSelectedEngine] = useState<string>(currentVehicle?.engine || '');
  const [isOpen, setIsOpen] = useState(false);

  // Load published makes from PostgreSQL
  useEffect(() => {
    async function fetchMakes() {
      try {
        const res = await fetch('/api/vehicles/makes');
        if (res.ok) {
          const data = await res.json();
          setMakes(data);
          if (currentVehicle?.make && !selectedMakeId) {
            const found = data.find((m: VehicleMake) => m.name.toLowerCase() === currentVehicle.make.toLowerCase());
            if (found) setSelectedMakeId(found.id);
          }
        }
      } catch (e) {
        console.error('Failed to load vehicle makes', e);
      }
    }
    fetchMakes();
  }, [currentVehicle]);

  // Load models for selected make
  useEffect(() => {
    if (!selectedMakeId) {
      setModels([]);
      return;
    }
    async function fetchModels() {
      try {
        const res = await fetch(`/api/vehicles/makes/${selectedMakeId}/models`);
        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (e) {
        console.error('Failed to load vehicle models', e);
      }
    }
    fetchModels();
  }, [selectedMakeId]);

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const makeId = e.target.value;
    setSelectedMakeId(makeId);
    const found = makes.find(m => m.id === makeId);
    setSelectedMake(found?.name || '');
    setSelectedModel('');
    setSelectedModelId('');
    setSelectedYear('');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    setSelectedModelId(modelId);
    const found = models.find(m => m.id === modelId);
    setSelectedModel(found?.name || '');
  };

  const selectedModelObj = models.find(m => m.id === selectedModelId || m.name === selectedModel);
  const availableYears = selectedModelObj?.years?.map(y => y.year) || Array.from({ length: 20 }, (_, i) => 2024 - i);

  const handleApply = () => {
    if (selectedMake && selectedModel && selectedYear) {
      onSelectVehicle({
        make: selectedMake,
        makeId: selectedMakeId,
        model: selectedModel,
        modelId: selectedModelId,
        year: Number(selectedYear),
        engine: selectedEngine || undefined
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedMake('');
    setSelectedMakeId('');
    setSelectedModel('');
    setSelectedModelId('');
    setSelectedYear('');
    setSelectedEngine('');
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
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: currentVehicle ? '#000000' : '#f2f4f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Car size={13} color={currentVehicle ? '#ffffff' : '#000000'} />
        </div>

        <div style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
          {currentVehicle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
                {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
              </span>
              <ShieldCheck size={14} color="#0d8239" />
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#787574' }}>
              {lang === 'ar' ? 'حدد سيارتك (تطابق مضمون)' : 'Select vehicle (Fitment filter)'}
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
            width: '330px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
            border: '1px solid var(--color-faint-border)',
            padding: '24px',
            zIndex: 300
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#000000', letterSpacing: '-0.025em', margin: 0 }}>
                {lang === 'ar' ? 'مرآب سيارتك' : 'Your Vehicle Garage'}
              </h4>
              <div style={{ fontSize: '11px', color: '#787574', marginTop: '2px' }}>
                {lang === 'ar' ? 'تصفية المنتجات المتوافقة 100%' : 'Filter guaranteed compatible parts'}
              </div>
            </div>
            {currentVehicle && (
              <button
                onClick={handleClear}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  color: '#d92d20',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                <X size={12} />
                <span>{lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Make */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '5px' }}>
                {lang === 'ar' ? 'المصنع (Make)' : 'Vehicle Manufacturer'}
              </label>
              <select
                value={selectedMakeId}
                onChange={handleMakeChange}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الشركة...' : 'Choose Manufacturer...'}</option>
                {makes.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '5px' }}>
                {lang === 'ar' ? 'الموديل (Model)' : 'Vehicle Model'}
              </label>
              <select
                value={selectedModelId}
                disabled={!selectedMakeId}
                onChange={handleModelChange}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الموديل...' : 'Choose Model...'}</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.generation ? `(${m.generation})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '5px' }}>
                {lang === 'ar' ? 'السنة (Year)' : 'Model Year'}
              </label>
              <select
                value={selectedYear}
                disabled={!selectedModel}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="shop-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              >
                <option value="">{lang === 'ar' ? 'اختر السنة...' : 'Choose Year...'}</option>
                {availableYears.map(y => (
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
              <span>{lang === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
