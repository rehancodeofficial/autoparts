import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Package, Truck, MapPin, Copy, RefreshCw, AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiPost, apiGet, ApiError, formatSar } from '../utils/api';

interface TrackingItem {
  sku: string | null;
  nameEn: string;
  nameAr: string;
  brandName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface TrackingOrder {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
  paidAt: string | null;
  customerName: string;
  address: string;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  subtotal: number;
  discount: number;
  discountCode: string | null;
  vat: number;
  shipping: number;
  total: number;
  refunded: number;
  currency: string;
  paymentMethod: string;
  trackingNumber: string | null;
  carrier: string | null;
  items: TrackingItem[];
  timeline: { message: string; status: string | null; at: string }[];
}

interface OrderConfirmationPageProps {
  /** 'confirmation' verifies the payment on return from the provider. */
  mode: 'confirmation' | 'tracking';
  lang: 'en' | 'ar';
  onNavigateHome: () => void;
}

const BRAND_RED = '#E53935';

/** Reads the order reference from the URL, falling back to the last checkout. */
function readReference(): { trackingToken: string | null; providerPaymentId: string | null } {
  const params = new URLSearchParams(window.location.search);
  let trackingToken = params.get('t') || params.get('token');
  const providerPaymentId =
    params.get('payment_id') || params.get('id') || params.get('invoice_id');

  // /track/<token>
  if (!trackingToken) {
    const match = window.location.pathname.match(/\/track\/([^/?#]+)/);
    if (match) trackingToken = decodeURIComponent(match[1]);
  }

  // A provider that drops the query string still leaves us the reference the
  // checkout stored before handing over.
  if (!trackingToken) {
    try {
      const stashed = sessionStorage.getItem('autoparts_last_order');
      if (stashed) trackingToken = JSON.parse(stashed)?.trackingToken ?? null;
    } catch { /* private browsing */ }
  }

  return { trackingToken, providerPaymentId };
}

function statusTone(paymentStatus: string, status: string) {
  if (paymentStatus === 'Paid') return { bg: '#ECFDF5', border: '#A7F3D0', fg: '#047857' };
  if (paymentStatus === 'Refunded' || paymentStatus === 'Partially Refunded') {
    return { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1D4ED8' };
  }
  if (status === 'PAYMENT_FAILED' || paymentStatus === 'Failed') {
    return { bg: '#FEF2F2', border: '#FECACA', fg: '#B91C1C' };
  }
  return { bg: '#FFFBEB', border: '#FDE68A', fg: '#B45309' };
}

const STEP_ORDER = ['PAID', 'APPROVED', 'PROCESSING', 'DISPATCHED', 'SHIPPED', 'DELIVERED'];
const STEP_LABEL: Record<string, string> = {
  PAID: 'Payment confirmed',
  APPROVED: 'Approved',
  PROCESSING: 'Being packed',
  DISPATCHED: 'Dispatched',
  SHIPPED: 'With courier',
  DELIVERED: 'Delivered',
};

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  mode,
  lang,
  onNavigateHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { trackingToken, providerPaymentId } = readReference();
    setToken(trackingToken);

    if (!trackingToken) {
      setError(
        'We could not find an order reference in this link. Please use the tracking link from your confirmation email.'
      );
      setLoading(false);
      return;
    }

    try {
      if (mode === 'confirmation') {
        // The redirect itself proves nothing: the server re-queries the
        // payment provider and only then records the result.
        const result = await apiPost<{
          tracking: TrackingOrder | null;
          paymentStatus: string;
          failureReason: string | null;
        }>('/api/payments/confirm', { trackingToken, providerPaymentId });

        setOrder(result.tracking);
        setFailureReason(result.failureReason ?? null);

        if (result.paymentStatus === 'PAID') {
          try {
            confetti({ particleCount: 90, spread: 72, origin: { y: 0.6 } });
          } catch { /* reduced-motion or unsupported */ }
        }
      } else {
        const result = await apiGet<TrackingOrder>(
          `/api/orders/track/${encodeURIComponent(trackingToken)}`
        );
        setOrder(result);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      // A confirmation that fails verification still has a readable order.
      if (mode === 'confirmation' && apiErr?.status !== 404) {
        try {
          setOrder(await apiGet<TrackingOrder>(
            `/api/orders/track/${encodeURIComponent(trackingToken)}`
          ));
        } catch { /* fall through to the error below */ }
      }
      setError(apiErr?.message || 'We could not load this order.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  const handleRetryPayment = async () => {
    if (!token) return;
    setRetrying(true);
    setError(null);
    try {
      const result = await apiPost<{ payment: { redirectUrl: string | null } }>(
        '/api/payments/retry',
        { trackingToken: token }
      );
      if (result.payment?.redirectUrl) {
        window.location.assign(result.payment.redirectUrl);
        return;
      }
      setError('The payment provider did not return a payment page. Please contact support.');
    } catch (err) {
      setError((err as ApiError)?.message || 'Could not restart the payment.');
    } finally {
      setRetrying(false);
    }
  };

  const copyTrackingLink = async () => {
    if (!token) return;
    const url = `${window.location.origin}/track/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy the link. Please copy it from the address bar.');
    }
  };

  const card: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  };

  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '6px 0',
    color: '#4B5563',
  };

  if (loading) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>
            {mode === 'confirmation'
              ? 'Verifying your payment with the bank…'
              : 'Loading your order…'}
          </div>
        </div>
      </main>
    );
  }

  const isPaid = order?.paymentStatus === 'Paid';
  const tone = order ? statusTone(order.paymentStatus, order.status) : null;
  const currentStep = order ? STEP_ORDER.indexOf(order.status) : -1;

  return (
    <main style={{ flex: 1, backgroundColor: '#EEEEEE', padding: '32px 16px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* Headline status */}
        {order ? (
          <div style={{
            ...card,
            backgroundColor: tone!.bg,
            border: `1px solid ${tone!.border}`,
            textAlign: 'center',
          }}>
            <div style={{ color: tone!.fg, marginBottom: '10px' }}>
              {isPaid ? <CheckCircle2 size={44} />
                : order.status === 'PAYMENT_FAILED' ? <XCircle size={44} />
                  : <Clock size={44} />}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
              {isPaid
                ? (lang === 'ar' ? 'تم تأكيد طلبك' : 'Your order is confirmed')
                : order.status === 'PAYMENT_FAILED'
                  ? (lang === 'ar' ? 'لم تكتمل عملية الدفع' : 'Payment was not completed')
                  : order.status === 'CANCELLED'
                    ? (lang === 'ar' ? 'تم إلغاء الطلب' : 'This order was cancelled')
                    : (lang === 'ar' ? 'في انتظار تأكيد الدفع' : 'Awaiting payment confirmation')}
            </h1>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
              {lang === 'ar' ? 'رقم الطلب' : 'Order'} #{order.orderNumber}
            </div>
            <div style={{ fontSize: '12px', color: tone!.fg, marginTop: '6px', fontWeight: 700 }}>
              {order.paymentStatus} · {order.deliveryStatus}
            </div>
            {failureReason && !isPaid && (
              <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '10px' }}>
                {failureReason}
              </div>
            )}
            {!isPaid && ['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(order.status) && (
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                style={{
                  marginTop: '16px',
                  backgroundColor: BRAND_RED,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: retrying ? 'not-allowed' : 'pointer',
                }}
              >
                {retrying
                  ? (lang === 'ar' ? 'جارٍ التحويل…' : 'Redirecting…')
                  : (lang === 'ar' ? 'إعادة محاولة الدفع' : 'Try payment again')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ color: '#B45309', marginBottom: '10px' }}><AlertTriangle size={40} /></div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
              {lang === 'ar' ? 'لم نتمكن من العثور على الطلب' : 'We could not find that order'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{error}</p>
          </div>
        )}

        {error && order && (
          <div style={{
            ...card,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: '13px',
            fontWeight: 600,
            padding: '14px 18px',
          }}>
            {error}
          </div>
        )}

        {order && (
          <>
            {/* Progress */}
            {currentStep >= 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 18px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {lang === 'ar' ? 'حالة الشحنة' : 'Delivery progress'}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {STEP_ORDER.map((step, idx) => {
                    const done = idx <= currentStep;
                    return (
                      <div key={step} style={{
                        flex: '1 1 120px',
                        minWidth: '120px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: done ? '#111827' : '#F3F4F6',
                        color: done ? '#ffffff' : '#9CA3AF',
                        fontSize: '11px',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}>
                        {STEP_LABEL[step]}
                      </div>
                    );
                  })}
                </div>
                {order.trackingNumber && (
                  <div style={{
                    marginTop: '18px',
                    padding: '14px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <Truck size={18} color={BRAND_RED} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>
                        {order.carrier || 'Courier'}
                      </div>
                      <div style={{ color: '#6B7280' }}>
                        {lang === 'ar' ? 'رقم التتبع' : 'Tracking number'}: {order.trackingNumber}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div style={card}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Package size={15} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                {lang === 'ar' ? 'المنتجات' : 'Items'} ({order.items.length})
              </h2>

              {order.items.map((item, idx) => (
                <div key={`${item.sku}-${idx}`} style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6',
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    backgroundColor: '#F3F4F6',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.nameEn}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                      {lang === 'ar' ? item.nameAr : item.nameEn}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                      {item.brandName ? `${item.brandName} · ` : ''}SKU {item.sku || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>
                      {item.quantity} × {formatSar(item.unitPrice, lang)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>
                    {formatSar(item.lineTotal, lang)}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '16px', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                <div style={row}>
                  <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{formatSar(order.subtotal, lang)}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ ...row, color: '#047857' }}>
                    <span>
                      {lang === 'ar' ? 'الخصم' : 'Discount'}
                      {order.discountCode ? ` (${order.discountCode})` : ''}
                    </span>
                    <span style={{ fontWeight: 600 }}>−{formatSar(order.discount, lang)}</span>
                  </div>
                )}
                <div style={row}>
                  <span>{lang === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {order.shipping === 0
                      ? (lang === 'ar' ? 'مجاني' : 'FREE')
                      : formatSar(order.shipping, lang)}
                  </span>
                </div>
                <div style={row}>
                  <span>{lang === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{formatSar(order.vat, lang)}</span>
                </div>
                <div style={{
                  ...row,
                  borderTop: '1px solid #E5E7EB',
                  marginTop: '8px',
                  paddingTop: '12px',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#111827',
                }}>
                  <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span>{formatSar(order.total, lang)}</span>
                </div>
                {order.refunded > 0 && (
                  <div style={{ ...row, color: '#1D4ED8', fontWeight: 700 }}>
                    <span>{lang === 'ar' ? 'المبلغ المُعاد' : 'Refunded'}</span>
                    <span>−{formatSar(order.refunded, lang)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery details */}
            <div style={card}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <MapPin size={15} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                {lang === 'ar' ? 'عنوان التوصيل' : 'Delivery address'}
              </h2>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{order.customerName}</div>
                <div>{order.address}</div>
                <div>
                  {[order.district, order.city, order.postalCode].filter(Boolean).join(', ')}
                </div>
                <div>{order.country}</div>
              </div>
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#6B7280' }}>
                {lang === 'ar' ? 'طريقة الدفع' : 'Payment method'}:{' '}
                <strong style={{ color: '#111827' }}>{order.paymentMethod}</strong>
              </div>
            </div>

            {/* History */}
            {order.timeline.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {lang === 'ar' ? 'سجل الطلب' : 'Order history'}
                </h2>
                {order.timeline.map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '8px 0' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: BRAND_RED, marginTop: '6px', flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', color: '#111827' }}>{entry.message}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {new Date(entry.at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Keep-this-link panel: tracking needs no account. */}
            {token && (
              <div style={{
                ...card,
                backgroundColor: '#161616',
                border: 'none',
                color: '#ffffff',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
                  {lang === 'ar' ? 'تابع طلبك في أي وقت' : 'Track this order any time'}
                </div>
                <div style={{ fontSize: '12px', color: '#A3A3A3', marginBottom: '14px' }}>
                  {lang === 'ar'
                    ? 'احفظ هذا الرابط — لا تحتاج إلى حساب.'
                    : 'Save this link — no account needed. Anyone with it can see this order, so keep it private.'}
                </div>
                <button
                  onClick={copyTrackingLink}
                  style={{
                    backgroundColor: copied ? '#047857' : BRAND_RED,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copied
                    ? (lang === 'ar' ? 'تم النسخ' : 'Link copied')
                    : (lang === 'ar' ? 'نسخ رابط التتبع' : 'Copy tracking link')}
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={onNavigateHome}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '12px 28px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#111827',
              cursor: 'pointer',
            }}
          >
            {lang === 'ar' ? 'متابعة التسوق' : 'Continue shopping'}
          </button>
        </div>
      </div>
    </main>
  );
};
