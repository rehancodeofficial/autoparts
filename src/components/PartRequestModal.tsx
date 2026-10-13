import React, { useState } from 'react';
import { PartRequest, Vehicle } from '../types';
import { Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

interface PartRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: Vehicle | null;
  onSubmit: (request: PartRequest) => void;
  lang: 'en' | 'ar';
}

export const PartRequestModal: React.FC<PartRequestModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  onSubmit,
  lang
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vinOrPartNumber, setVinOrPartNumber] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: PartRequest = {
      id: `req-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      name,
      phone,
      email: '',
      vehicleMake: selectedVehicle?.make || 'Toyota',
      vehicleModel: selectedVehicle?.model || 'Camry',
      vehicleYear: selectedVehicle?.year || 2022,
      vinOrPartNumber,
      description,
      status: 'New'
    };
    onSubmit(req);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '24px'
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: '#f2f4f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000'
          }}>
            <Wrench size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-0.03em', color: '#000000' }}>
              {lang === 'ar' ? 'طلب قطعة عبر رقم الهيكل (VIN)' : 'Request a Part via VIN'}
            </h2>
            <div style={{ fontSize: '12px', color: '#787574' }}>
              Direct supplier parts sourcing across Saudi Arabia
            </div>
          </div>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <CheckCircle2 size={44} color="#0d8239" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000000' }}>
              {lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Part Sourcing Request Sent!'}
            </h3>
            <p style={{ fontSize: '13px', color: '#787574', marginTop: '6px' }}>
              Our procurement team will send a WhatsApp quote shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الاسم' : 'Name'}
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shop-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الجوال' : 'Mobile Phone'}
                </label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="shop-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                {lang === 'ar' ? 'رقم الهيكل (VIN) أو رقم القطعة' : 'VIN (Chassis Number) or Part #'}
              </label>
              <input
                type="text"
                value={vinOrPartNumber}
                onChange={(e) => setVinOrPartNumber(e.target.value)}
                placeholder="e.g. 4T1B11HK5JU..."
                className="shop-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                {lang === 'ar' ? 'وصف القطعة' : 'Part Description'}
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the required spare part..."
                className="shop-input"
                style={{ width: '100%', borderRadius: '20px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn-shop-pill" style={{ flex: 1, padding: '12px' }}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-shop-primary" style={{ flex: 1, padding: '12px' }}>
                <span>{lang === 'ar' ? 'إرسال الطلب' : 'Submit Request'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
