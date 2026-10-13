import React, { useState } from 'react';
import { CartItem, PaymentMethod, Order } from '../types';
import { X, CheckCircle2, QrCode, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
  lang: 'en' | 'ar';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  isOpen,
  onClose,
  onOrderPlaced,
  lang
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [name, setName] = useState('Sultan Al-Otaibi');
  const [phone, setPhone] = useState('+966 50 123 4567');
  const [city, setCity] = useState('Riyadh');
  const [address, setAddress] = useState('Al Malqa District, Anas Ibn Malik Rd');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.part.price * item.quantity, 0);
  const vat = subtotal * 0.15;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + vat + shipping;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newOrder: Order = {
        id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
        orderNumber: `KSA-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        customerName: name,
        customerPhone: phone,
        city,
        address,
        items: [...cart],
        subtotal,
        vat,
        shipping,
        total,
        paymentMethod,
        paymentStatus: 'Paid',
        deliveryStatus: 'Processing',
        trackingNumber: `SMSA-${Math.floor(100000000 + Math.random() * 900000000)}`,
        carrier: 'SMSA Express KSA',
        zatcaQrString: 'AQZTYXVkaSBBdXRvUGFydHMDFDEwMTIzNDU2NzgwMDAwMwMT'
      };

      setPlacedOrder(newOrder);
      setIsProcessing(false);
      setStep('success');
      onOrderPlaced(newOrder);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '24px'
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          padding: '32px'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: lang === 'en' ? '20px' : 'auto',
            left: lang === 'ar' ? '20px' : 'auto',
            backgroundColor: '#f2f4f5',
            border: 'none',
            color: '#000000',
            borderRadius: '9999px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        {step === 'details' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.04em', color: '#000000', marginBottom: '20px' }}>
              {lang === 'ar' ? 'عنوان التوصيل (المملكة العربية السعودية)' : 'Saudi Delivery Address'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
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
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="shop-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'المدينة' : 'City'}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="shop-input"
                  style={{ width: '100%' }}
                >
                  <option value="Riyadh">الرياض (Riyadh)</option>
                  <option value="Jeddah">جدة (Jeddah)</option>
                  <option value="Dammam">الدمام (Dammam)</option>
                  <option value="Khobar">الخبر (Khobar)</option>
                  <option value="Mecca">مكة المكرمة</option>
                  <option value="Medina">المدينة المنورة</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#787574', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الحي / العنوان الوطني' : 'District / National Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="shop-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Summary Box */}
            <div style={{ backgroundColor: '#f2f4f5', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#787574' }}>
                <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{subtotal.toFixed(2)} SAR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#787574' }}>
                <span>{lang === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                <span>{vat.toFixed(2)} SAR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#787574' }}>
                <span>{lang === 'ar' ? 'الشحن السريع (سمسا)' : 'Express Courier (SMSA)'}</span>
                <span>{shipping === 0 ? 'FREE' : `${shipping.toFixed(2)} SAR`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #ebebeb', fontSize: '18px', fontWeight: '700', color: '#000000' }}>
                <span>{lang === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                <span>{total.toFixed(2)} SAR</span>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              className="btn-shop-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              <span>{lang === 'ar' ? 'المتابعة إلى خيارات الدفع' : 'Proceed to Payment'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.04em', color: '#000000', marginBottom: '8px' }}>
              {lang === 'ar' ? 'طريقة الدفع الإلكتروني' : 'Select Payment Method'}
            </h2>
            <p style={{ fontSize: '13px', color: '#787574', marginBottom: '20px' }}>
              {lang === 'ar' ? 'عملية دفع فورية وآمنة عبر بوابة Tap / HyperPay' : 'Direct encrypted checkout via Tap / HyperPay Saudi Gateway'}
            </p>

            {/* Payment Method Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {/* mada */}
              <div
                onClick={() => setPaymentMethod('mada')}
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  backgroundColor: paymentMethod === 'mada' ? '#f2f4f5' : '#ffffff',
                  border: paymentMethod === 'mada' ? '2px solid #000000' : '1px solid #ebebeb',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#006C35' }}>mada</div>
                <div style={{ fontSize: '11px', color: '#787574', marginTop: '2px' }}>بطاقة مدى</div>
              </div>

              {/* Apple Pay */}
              <div
                onClick={() => setPaymentMethod('apple_pay')}
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  backgroundColor: paymentMethod === 'apple_pay' ? '#f2f4f5' : '#ffffff',
                  border: paymentMethod === 'apple_pay' ? '2px solid #000000' : '1px solid #ebebeb',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#000000' }}>Apple Pay</div>
                <div style={{ fontSize: '11px', color: '#787574', marginTop: '2px' }}>أبل باي</div>
              </div>

              {/* STC Pay */}
              <div
                onClick={() => setPaymentMethod('stc_pay')}
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  backgroundColor: paymentMethod === 'stc_pay' ? '#f2f4f5' : '#ffffff',
                  border: paymentMethod === 'stc_pay' ? '2px solid #000000' : '1px solid #ebebeb',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#4f46e5' }}>stc pay</div>
                <div style={{ fontSize: '11px', color: '#787574', marginTop: '2px' }}>محفظة رقمية</div>
              </div>

              {/* Tamara */}
              <div
                onClick={() => setPaymentMethod('tamara')}
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  backgroundColor: paymentMethod === 'tamara' ? '#f2f4f5' : '#ffffff',
                  border: paymentMethod === 'tamara' ? '2px solid #000000' : '1px solid #ebebeb',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#d97706' }}>Tamara</div>
                <div style={{ fontSize: '11px', color: '#787574', marginTop: '2px' }}>قسّمها 4 دفعات</div>
              </div>
            </div>

            {/* Sandbox Notice */}
            <div style={{
              backgroundColor: '#f2f4f5',
              borderRadius: '20px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Lock size={18} color="#5433eb" />
              <div style={{ fontSize: '13px', color: '#332f2d' }}>
                Method: <b>{paymentMethod.toUpperCase()}</b> • Amount: <b>{total.toFixed(2)} SAR</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep('details')}
                className="btn-shop-pill"
                style={{ padding: '14px 24px' }}
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="btn-shop-primary"
                style={{ flex: 1, padding: '14px', fontSize: '15px' }}
              >
                {isProcessing ? 'Processing with Gateway...' : `Complete Order (${total.toFixed(2)} SAR)`}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && placedOrder && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '9999px',
              backgroundColor: '#e6f9ed',
              color: '#0d8239',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '-0.04em', color: '#000000', marginBottom: '6px' }}>
              {lang === 'ar' ? 'تم تأكيد طلبك بنجاح' : 'Order Placed Successfully'}
            </h2>
            <p style={{ fontSize: '14px', color: '#787574', marginBottom: '24px' }}>
              Order Reference: <b style={{ color: '#000000' }}>{placedOrder.orderNumber}</b>
            </p>

            <div style={{
              backgroundColor: '#f2f4f5',
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#000000' }}>فاتورة ضريبية مبسطة (ZATCA e-Invoice)</span>
                <QrCode size={18} color="#000000" />
              </div>
              <div style={{ fontSize: '12px', color: '#332f2d', lineHeight: '1.8' }}>
                <div><b>Customer:</b> {placedOrder.customerName}</div>
                <div><b>Delivery:</b> {placedOrder.address}, {placedOrder.city}</div>
                <div><b>Carrier:</b> {placedOrder.carrier} (Tracking: <code>{placedOrder.trackingNumber}</code>)</div>
                <div><b>Payment:</b> {placedOrder.paymentMethod.toUpperCase()} (Status: <b>PAID</b>)</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-shop-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              {lang === 'ar' ? 'العودة للتسوق' : 'Continue Shopping'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
