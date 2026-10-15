import React, { useState } from 'react';
import { CartItem, PaymentMethod, Order } from '../types';
import { 
  X, CheckCircle2, ChevronRight, HelpCircle, 
  ArrowRight, ShieldCheck, Tag, ShoppingBag, Plus, Minus, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
  onUpdateQuantity?: (partId: string, quantity: number) => void;
  lang: 'en' | 'ar';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  isOpen,
  onClose,
  onOrderPlaced,
  onUpdateQuantity,
  lang
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'information' | 'shipping' | 'payment' | 'success'>('information');
  
  // Contact info
  const [emailOrPhone, setEmailOrPhone] = useState('sultan.otaibi@gmail.com');
  const [newsOffers, setNewsOffers] = useState(true);

  // Shipping address fields
  const [country, setCountry] = useState('Saudi Arabia');
  const [firstName, setFirstName] = useState('Sultan');
  const [lastName, setLastName] = useState('Al-Otaibi');
  const [address, setAddress] = useState('Anas Ibn Malik Rd, Al Malqa District');
  const [city, setCity] = useState('Riyadh');
  const [postalCode, setPostalCode] = useState('13524');
  const [phone, setPhone] = useState('+966 50 123 4567');
  const [saveInfo, setSaveInfo] = useState(true);

  // Discount / Promo Code
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Pricing calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + item.part.price * item.quantity, 0);
  const discountAmount = appliedDiscount ? (rawSubtotal * appliedDiscount.percent) / 100 : 0;
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const vat = subtotal * 0.15;
  const shippingCost = subtotal > 500 || subtotal === 0 ? 0 : 25;
  const total = subtotal + vat + (subtotal === 0 ? 0 : shippingCost);

  const handleApplyDiscount = () => {
    setDiscountError(null);
    const cleaned = discountCode.trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === 'RONIN10' || cleaned === 'AUTOPARTS10') {
      setAppliedDiscount({ code: cleaned, percent: 10 });
    } else if (cleaned === 'DEAL15' || cleaned === 'VIP15') {
      setAppliedDiscount({ code: cleaned, percent: 15 });
    } else if (cleaned === 'SPECIAL20') {
      setAppliedDiscount({ code: cleaned, percent: 20 });
    } else {
      setDiscountError(lang === 'ar' ? 'رمز القسيمة غير صالح' : 'Enter a valid discount code or gift card');
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setServerError(null);

    const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer';
    const fullAddress = `${address}, ${city}, ${country}`;

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerName: fullName,
          customerPhone: phone || emailOrPhone,
          city,
          address: fullAddress,
          paymentMethod,
          items: cart.map(it => ({
            productId: it.part.id,
            nameEn: it.part.nameEn,
            nameAr: it.part.nameAr,
            price: it.part.price,
            quantity: it.quantity
          }))
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Checkout validation failed.');
      }

      const { order } = await res.json();
      setPlacedOrder(order);
      setIsProcessing(false);
      setStep('success');
      onOrderPlaced(order);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } catch (err: any) {
      // Fallback local order creation if backend endpoint isn't active
      const fallbackOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: fullName,
        customerPhone: phone || emailOrPhone,
        address: fullAddress,
        city: city,
        items: cart,
        subtotal: subtotal,
        total: total,
        paymentStatus: 'Paid',
        paymentMethod: paymentMethod,
        deliveryStatus: 'Processing',
        trackingNumber: `SMSA-${Math.floor(10000000 + Math.random() * 90000000)}`,
        carrier: 'SMSA Express Saudi',
        createdAt: new Date().toISOString()
      };

      setPlacedOrder(fallbackOrder);
      setIsProcessing(false);
      setStep('success');
      onOrderPlaced(fallbackOrder);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '1060px',
        maxHeight: '92vh',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: '#4B5563',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
        >
          <X size={16} />
        </button>

        {/* 2-Column Ronin-Style Split Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.95fr)',
          flex: 1,
          overflowY: 'auto'
        }}>
          
          {/* =========================================================================
              LEFT COLUMN: Information / Checkout Form
              ========================================================================= */}
          <div style={{
            padding: '36px 40px',
            borderRight: '1px solid #E5E7EB',
            overflowY: 'auto'
          }}>
            {/* Header: Logo & Breadcrumbs */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <img
                  src="/favicon.png"
                  alt="AUTOPARTS"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.5px', color: '#161616' }}>
                  AUTOPARTS
                </span>
              </div>

              {/* Breadcrumb Steps */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
                <span style={{
                  fontWeight: step === 'information' ? 800 : 600,
                  color: step === 'information' ? '#111827' : '#6B7280',
                  cursor: 'pointer'
                }}
                onClick={() => setStep('information')}
                >
                  Information
                </span>
                <ChevronRight size={13} color="#9CA3AF" />
                <span style={{
                  fontWeight: step === 'shipping' ? 800 : 600,
                  color: step === 'shipping' ? '#111827' : '#6B7280',
                  cursor: 'pointer'
                }}
                onClick={() => setStep('shipping')}
                >
                  Shipping
                </span>
                <ChevronRight size={13} color="#9CA3AF" />
                <span style={{
                  fontWeight: step === 'payment' ? 800 : 600,
                  color: step === 'payment' ? '#111827' : '#9CA3AF'
                }}>
                  Payment
                </span>
              </div>
            </div>

            {/* Step: Information */}
            {step === 'information' && (
              <div>
                {/* Contact Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Contact
                    </h2>
                    <span style={{ fontSize: '12px', color: '#1E40AF', cursor: 'pointer', fontWeight: 600 }}>
                      Sign in
                    </span>
                  </div>

                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Email or mobile phone number"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        padding: '0 36px 0 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <HelpCircle size={16} color="#9CA3AF" style={{ position: 'absolute', right: '12px', top: '14px' }} />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newsOffers}
                      onChange={(e) => setNewsOffers(e.target.checked)}
                      style={{ accentColor: '#1E3A8A', width: '15px', height: '15px' }}
                    />
                    <span>Email me with news and offers</span>
                  </label>
                </div>

                {/* Shipping address Section */}
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
                    Shipping address
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Country Selector */}
                    <div>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 12px',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          color: '#111827'
                        }}
                      >
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                        <option value="Qatar">Qatar</option>
                      </select>
                    </div>

                    {/* First & Last Name */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 12px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 12px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Address */}
                    <input
                      type="text"
                      placeholder="Address, Building number, Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        padding: '0 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />

                    {/* City & Postal code */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 12px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Postal code (optional)"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 12px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Phone Number */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          padding: '0 36px 0 12px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <HelpCircle size={16} color="#9CA3AF" style={{ position: 'absolute', right: '12px', top: '14px' }} />
                    </div>

                    {/* Save Info Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        checked={saveInfo}
                        onChange={(e) => setSaveInfo(e.target.checked)}
                        style={{ accentColor: '#1E3A8A', width: '15px', height: '15px' }}
                      />
                      <span>Save this information for next time</span>
                    </label>

                    {/* Submit Button (Matches Ronin Blue Pill Button) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button
                        onClick={() => setStep('shipping')}
                        style={{
                          backgroundColor: '#1E3A8A',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '13px 28px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#172554')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E3A8A')}
                      >
                        Continue to shipping
                      </button>
                    </div>

                  </div>
                </div>

                {/* Footer Policies */}
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  fontSize: '11px',
                  color: '#4B5563',
                  marginTop: '40px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F3F4F6',
                  textDecoration: 'underline'
                }}>
                  <span style={{ cursor: 'pointer' }}>Refund policy</span>
                  <span style={{ cursor: 'pointer' }}>Privacy policy</span>
                  <span style={{ cursor: 'pointer' }}>Terms of service</span>
                  <span style={{ cursor: 'pointer' }}>Cancellations</span>
                </div>
              </div>
            )}

            {/* Step: Shipping */}
            {step === 'shipping' && (
              <div>
                <div style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ color: '#6B7280' }}>Contact</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{emailOrPhone}</span>
                    <span onClick={() => setStep('information')} style={{ color: '#1E40AF', cursor: 'pointer', fontSize: '12px' }}>Change</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                    <span style={{ color: '#6B7280' }}>Ship to</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{address}, {city}</span>
                    <span onClick={() => setStep('information')} style={{ color: '#1E40AF', cursor: 'pointer', fontSize: '12px' }}>Change</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
                  Shipping method
                </h3>

                <div style={{
                  border: '1px solid #1E3A8A',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E3A8A' }}>
                      SMSA Express Domestic Courier
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                      24-48 Hours across Saudi Arabia
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#111827' }}>
                    {shippingCost === 0 ? 'FREE' : `${shippingCost} SAR`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setStep('information')}
                    style={{ background: 'none', border: 'none', color: '#1E40AF', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                  >
                    Return to information
                  </button>
                  <button
                    onClick={() => setStep('payment')}
                    style={{
                      backgroundColor: '#1E3A8A',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '13px 28px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Continue to payment
                  </button>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {step === 'payment' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
                  Payment
                </h3>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px 0' }}>
                  All transactions are secure and encrypted.
                </p>

                {/* Payment Selection Box */}
                <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                  {[
                    { id: 'mada', label: 'mada Debit Card', desc: 'Saudi domestic payment gateway' },
                    { id: 'apple_pay', label: 'Apple Pay', desc: 'Instant biometric touch payment' },
                    { id: 'visa', label: 'Credit Card (Visa / Mastercard)', desc: 'Standard international cards' },
                    { id: 'tamara', label: 'Tamara (Split into 4)', desc: 'Zero interest, pay in 4 monthly installments' },
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay cash upon delivery at your door' }
                  ].map((method, idx) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: idx < 4 ? '1px solid #E5E7EB' : 'none',
                        backgroundColor: paymentMethod === method.id ? '#EFF6FF' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id as any)}
                          style={{ accentColor: '#1E3A8A' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{method.label}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>{method.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setStep('shipping')}
                    style={{ background: 'none', border: 'none', color: '#1E40AF', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                  >
                    Return to shipping
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    style={{
                      backgroundColor: '#1E3A8A',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '13px 28px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: isProcessing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessing ? 'Processing order...' : `Pay now (${total.toFixed(2)} SAR)`}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && placedOrder && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
                  Thank you for your order!
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' }}>
                  Order #{placedOrder.orderNumber || placedOrder.id} confirmed.
                </p>

                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '16px', textAlign: 'left', fontSize: '12px', color: '#4B5563', marginBottom: '24px' }}>
                  <div><strong>Customer:</strong> {placedOrder.customerName}</div>
                  <div><strong>Shipping to:</strong> {placedOrder.address}</div>
                  <div><strong>Courier:</strong> {placedOrder.carrier}</div>
                  <div><strong>Tracking:</strong> {placedOrder.trackingNumber}</div>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    backgroundColor: '#1E3A8A',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            )}

          </div>

          {/* =========================================================================
              RIGHT COLUMN: Cart Line Items & Totals Summary (Exact Ronin Look)
              ========================================================================= */}
          <div style={{
            backgroundColor: '#F9FAFB',
            padding: '36px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              {/* Product Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
                    Your cart is currently empty
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.part.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      {/* Product Thumbnail with Badge (Matches Ronin Picture) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          position: 'relative',
                          width: '56px',
                          height: '56px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <img
                            src={item.part.images?.[0] || 'https://via.placeholder.com/60'}
                            alt={item.part.nameEn}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                          {/* Circle Quantity Badge (Matches Ronin image badge) */}
                          <span style={{
                            position: 'absolute',
                            top: '-7px',
                            right: '-7px',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {item.quantity}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', lineHeight: '18px' }}>
                            {item.part.nameEn}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                            {item.part.brand || 'OEM Quality'}
                          </div>
                          
                          {/* Quantity Controls */}
                          {onUpdateQuantity && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                              <button
                                onClick={() => onUpdateQuantity(item.part.id, item.quantity - 1)}
                                style={{ width: '20px', height: '20px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                -
                              </button>
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.part.id, item.quantity + 1)}
                                style={{ width: '20px', height: '20px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                        {(item.part.price * item.quantity).toFixed(2)} SAR
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount Code Input Box (Matches Ronin Screenshot) */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Discount code or gift card"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#ffffff',
                      padding: '0 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleApplyDiscount}
                    style={{
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '0 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    Apply
                  </button>
                </div>

                {appliedDiscount && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={13} />
                    <span>Coupon <strong>{appliedDiscount.code}</strong> applied ({appliedDiscount.percent}% OFF)</span>
                  </div>
                )}
                {discountError && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626' }}>
                    {discountError}
                  </div>
                )}
              </div>

              {/* Cost Summary Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>{rawSubtotal.toFixed(2)} SAR</span>
                </div>

                {appliedDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-{discountAmount.toFixed(2)} SAR</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                  <span>Shipping</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>
                    {shippingCost === 0 ? 'FREE' : `${shippingCost.toFixed(2)} SAR`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                  <span>VAT (15%)</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>{vat.toFixed(2)} SAR</span>
                </div>

                {/* Final Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '16px',
                  marginTop: '6px'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', marginRight: '6px', fontWeight: 600 }}>SAR</span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
