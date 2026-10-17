import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, ShoppingBag, X, Truck, Package, CreditCard,
  ClipboardList, AlertTriangle, StickyNote, Undo2,
} from 'lucide-react';
import { Order, OrderDetail, OrderStats, OrderStatus } from '../types';
import { apiGet, apiPatch, apiPost, ApiError, formatSar } from '../utils/api';

interface AdminOrdersPanelProps {
  lang: 'en' | 'ar';
  /** Called after a change so the rest of the dashboard reloads too. */
  onDataChanged?: () => void;
}

const BRAND_RED = '#E53935';

/** Operator-facing labels for the status machine. */
const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PAID: 'Paid — Needs Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment Failed',
  EXPIRED: 'Expired',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: '#FFFBEB', fg: '#B45309' },
  PAID: { bg: '#ECFDF5', fg: '#047857' },
  APPROVED: { bg: '#EFF6FF', fg: '#1D4ED8' },
  REJECTED: { bg: '#FEF2F2', fg: '#B91C1C' },
  PROCESSING: { bg: '#EEF2FF', fg: '#4338CA' },
  DISPATCHED: { bg: '#F0F9FF', fg: '#0369A1' },
  SHIPPED: { bg: '#F0FDFA', fg: '#0F766E' },
  DELIVERED: { bg: '#ECFDF5', fg: '#065F46' },
  CANCELLED: { bg: '#F3F4F6', fg: '#4B5563' },
  PAYMENT_FAILED: { bg: '#FEF2F2', fg: '#B91C1C' },
  EXPIRED: { bg: '#F3F4F6', fg: '#6B7280' },
  RETURN_REQUESTED: { bg: '#FFF7ED', fg: '#C2410C' },
  RETURNED: { bg: '#FFF7ED', fg: '#9A3412' },
  REFUNDED: { bg: '#EFF6FF', fg: '#1D4ED8' },
};

/** Transitions that destroy value or cannot be undone need a confirmation. */
const DESTRUCTIVE: OrderStatus[] = ['CANCELLED', 'REJECTED', 'REFUNDED', 'RETURNED'];

/** The action button wording an operator expects for each transition. */
const ACTION_LABEL: Record<string, string> = {
  APPROVED: 'Approve order',
  REJECTED: 'Reject order',
  PROCESSING: 'Start processing',
  DISPATCHED: 'Mark dispatched',
  SHIPPED: 'Hand to courier',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel order',
  REFUNDED: 'Mark refunded',
  RETURN_REQUESTED: 'Log return request',
  RETURNED: 'Mark returned',
  PENDING_PAYMENT: 'Re-open for payment',
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const tone = STATUS_COLOR[status] || { bg: '#F3F4F6', fg: '#4B5563' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '999px',
      backgroundColor: tone.bg,
      color: tone.fg,
      fontSize: '11px',
      fontWeight: 800,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
};

const inputStyle: React.CSSProperties = {
  height: '38px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  padding: '0 12px',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  display: 'block',
  marginBottom: '5px',
};

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({ lang, onDataChanged }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [offset, setOffset] = useState(0);
  const limit = 25;

  // Detail drawer
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Confirmation dialog for irreversible actions
  const [confirming, setConfirming] = useState<{
    status: OrderStatus; label: string; warning: string;
  } | null>(null);
  const [confirmReason, setConfirmReason] = useState('');

  // Fulfilment form
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPostal, setEditPostal] = useState('');

  // Refund form
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', `${dateTo}T23:59:59Z`);
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const [list, s] = await Promise.all([
        apiGet<{ orders: Order[]; total: number }>(`/api/admin/orders?${params}`),
        apiGet<OrderStats>('/api/admin/orders/stats'),
      ]);
      setOrders(list.orders || []);
      setTotal(list.total || 0);
      setStats(s);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.isUnauthorized
          ? 'Your admin session has expired. Please sign in again.'
          : apiErr.message || 'Could not load orders.'
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, dateFrom, dateTo, sortBy, sortDir, offset]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (actionError) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [actionError]);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openDetail = async (orderId: string) => {
    setDetailLoading(true);
    setActionError(null);
    setRefundOpen(false);
    setActionNote('');
    try {
      const result = await apiGet<OrderDetail>(`/api/admin/orders/${orderId}`);
      setDetail(result);
      setTrackingNumber(result.order.trackingNumber || '');
      setCarrier(result.order.carrier || '');
      setEditCity(result.order.city || '');
      setEditAddress(result.order.address || '');
      setEditPostal(result.order.postalCode || '');
      const refundable = Math.max(0, (result.order.total || 0) - (result.order.refunded || 0));
      setRefundAmount(refundable.toFixed(2));
      setRefundReason('');
    } catch (err) {
      setActionError((err as ApiError).message || 'Could not open that order.');
    } finally {
      setDetailLoading(false);
    }
  };

  const afterChange = async (orderId: string) => {
    await Promise.all([openDetail(orderId), loadOrders()]);
    onDataChanged?.();
  };

  const requestTransition = (status: OrderStatus) => {
    setActionError(null);
    if (!detail) return;

    if (DESTRUCTIVE.includes(status)) {
      const warnings: Record<string, string> = {
        CANCELLED: detail.order.stockCommitted
          ? 'The items will be returned to stock. If the order was paid, refund it separately — cancelling does not move money.'
          : 'This order will be cancelled.',
        REJECTED: 'The customer will see this order as cancelled. Any captured payment must be refunded separately.',
        REFUNDED: 'This only records a refund status. Use "Refund payment" below to actually return money through the provider.',
        RETURNED: 'The items will be returned to stock.',
      };
      setConfirmReason('');
      setConfirming({
        status,
        label: ACTION_LABEL[status] || status,
        warning: warnings[status] || 'This action cannot be undone.',
      });
      return;
    }

    void applyTransition(status);
  };

  const applyTransition = async (status: OrderStatus, reason?: string) => {
    if (!detail) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiPatch(`/api/admin/orders/${detail.order.id}/status`, {
        status,
        note: actionNote || undefined,
        reason: reason || undefined,
      });
      setConfirming(null);
      setActionNote('');
      await afterChange(detail.order.id);
    } catch (err) {
      setActionError((err as ApiError).message || 'Could not change the order status.');
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  const saveFulfilment = async () => {
    if (!detail) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiPatch(`/api/admin/orders/${detail.order.id}/fulfilment`, {
        trackingNumber: trackingNumber.trim() || null,
        carrier: carrier.trim() || null,
        city: editCity.trim() || undefined,
        address: editAddress.trim() || undefined,
        postalCode: editPostal.trim() || null,
      });
      await afterChange(detail.order.id);
    } catch (err) {
      setActionError((err as ApiError).message || 'Could not save the shipping details.');
    } finally {
      setBusy(false);
    }
  };

  const addNote = async () => {
    if (!detail || !actionNote.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiPost(`/api/admin/orders/${detail.order.id}/notes`, { note: actionNote.trim() });
      setActionNote('');
      await afterChange(detail.order.id);
    } catch (err) {
      setActionError((err as ApiError).message || 'Could not save the note.');
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async () => {
    if (!detail) return;
    const amount = Number(refundAmount);
    const refundable = Math.max(0, (detail.order.total || 0) - (detail.order.refunded || 0));

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a refund amount greater than zero.');
      return;
    }
    if (amount > refundable + 0.001) {
      setActionError(`The most you can refund on this order is ${formatSar(refundable, lang)}.`);
      return;
    }
    if (!window.confirm(
      `Refund ${formatSar(amount, lang)} for order ${detail.order.orderNumber}?\n\n` +
      'This sends a refund request to the payment provider and cannot be undone.'
    )) return;

    setBusy(true);
    setActionError(null);
    try {
      await apiPost(`/api/admin/orders/${detail.order.id}/refund`, {
        amount,
        reason: refundReason.trim() || undefined,
      });
      setRefundOpen(false);
      await afterChange(detail.order.id);
    } catch (err) {
      setActionError((err as ApiError).message || 'The refund could not be processed.');
    } finally {
      setBusy(false);
    }
  };

  const card: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  const statTiles: { label: string; value: number | string; tone?: string }[] = stats ? [
    { label: 'Total orders', value: stats.totalOrders },
    { label: 'Awaiting payment', value: stats.pendingPayment, tone: '#B45309' },
    { label: 'Needs approval', value: stats.awaitingApproval, tone: '#047857' },
    { label: 'In fulfilment', value: stats.inFulfilment, tone: '#4338CA' },
    { label: 'In transit', value: stats.inTransit, tone: '#0369A1' },
    { label: 'Delivered', value: stats.delivered, tone: '#065F46' },
    { label: 'Failed payments', value: stats.failedPayment, tone: '#B91C1C' },
    { label: 'Refunded', value: stats.refunded, tone: '#1D4ED8' },
    { label: 'Net revenue', value: formatSar(stats.netRevenue, lang), tone: BRAND_RED },
  ] : [];

  return (
    <div>
      {/* Live figures, straight from the database */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {statTiles.map(tile => (
            <div key={tile.label} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tile.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: tile.tone || '#111827', marginTop: '4px' }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
            Customer Orders &amp; Shipments
          </h2>
          <button
            onClick={() => loadOrders()}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
              borderRadius: '8px', padding: '8px 14px', fontSize: '12px',
              fontWeight: 700, color: '#374151',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Search, filter, sort */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}>
          <div style={{ gridColumn: 'span 2', minWidth: '220px' }}>
            <label style={labelStyle}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '11px', top: '12px', color: '#9CA3AF' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Order number, name, email, phone, SKU, tracking…"
                style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Order status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">All statuses</option>
              {Object.keys(STATUS_LABEL).map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Payment</label>
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setOffset(0); }}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">All payments</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Partially Refunded">Partially Refunded</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>From</label>
            <input type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setOffset(0); }}
              style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setOffset(0); }}
              style={{ ...inputStyle, width: '100%' }} />
          </div>

          <div>
            <label style={labelStyle}>Sort by</label>
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [col, dir] = e.target.value.split(':');
                setSortBy(col);
                setSortDir(dir as 'asc' | 'desc');
              }}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="total:desc">Highest value</option>
              <option value="total:asc">Lowest value</option>
              <option value="orderNumber:asc">Order number</option>
              <option value="customerName:asc">Customer name</option>
              <option value="updatedAt:desc">Recently updated</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            color: '#B91C1C', fontSize: '12px', fontWeight: 700,
          }}>
            <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 8px auto', display: 'block', color: '#D1D5DB' }} />
            <div style={{ fontWeight: 700, color: '#374151' }}>
              {search || statusFilter || paymentFilter || dateFrom || dateTo
                ? 'No orders match these filters'
                : 'No Customer Orders Yet'}
            </div>
            <div style={{ fontSize: '12px' }}>
              {search || statusFilter || paymentFilter
                ? 'Try widening your search.'
                : 'Incoming orders will be listed here for fulfilment.'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Order</th>
                    <th style={{ padding: '12px 14px' }}>Placed</th>
                    <th style={{ padding: '12px 14px' }}>Customer</th>
                    <th style={{ padding: '12px 14px' }}>Items</th>
                    <th style={{ padding: '12px 14px' }}>Total</th>
                    <th style={{ padding: '12px 14px' }}>Payment</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {order.orderNumber}
                        {order.isGuest && (
                          <span style={{ marginLeft: '6px', fontSize: '10px', color: '#9CA3AF', fontWeight: 700 }}>
                            GUEST
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
                              day: '2-digit', month: 'short', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{order.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {order.customerEmail || order.customerPhone || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6B7280' }}>
                        {order.unitCount ?? order.itemCount ?? 0}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: BRAND_RED, whiteSpace: 'nowrap' }}>
                        {formatSar(order.total, lang)}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: order.paymentStatus === 'Paid' ? '#047857' : order.paymentStatus === 'Failed' ? '#B91C1C' : '#B45309' }}>
                        {order.paymentStatus}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusPill status={order.status} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => openDetail(order.id)}
                          style={{
                            backgroundColor: '#111827', color: '#ffffff', border: 'none',
                            borderRadius: '7px', padding: '7px 14px', fontSize: '11px',
                            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', color: '#6B7280' }}>
              <span>
                Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  style={{
                    padding: '7px 14px', borderRadius: '7px', border: '1px solid #D1D5DB',
                    backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 700,
                    cursor: offset === 0 ? 'not-allowed' : 'pointer',
                    color: offset === 0 ? '#D1D5DB' : '#374151',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  style={{
                    padding: '7px 14px', borderRadius: '7px', border: '1px solid #D1D5DB',
                    backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 700,
                    cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                    color: offset + limit >= total ? '#D1D5DB' : '#374151',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= Detail drawer ================= */}
      {(detail || detailLoading) && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10000, display: 'flex', justifyContent: 'flex-end',
          }}
          onClick={() => { setDetail(null); setConfirming(null); }}
        >
          <div
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(760px, 100%)', backgroundColor: '#F8F9FA',
              height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
            }}
          >
            {detailLoading || !detail ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Loading order…</div>
            ) : (
              <>
                {/* Drawer header */}
                <div style={{
                  position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#161616',
                  color: '#ffffff', padding: '20px 24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{detail.order.orderNumber}</div>
                    <div style={{ fontSize: '11px', color: '#A3A3A3', marginTop: '4px' }}>
                      {detail.order.createdAt
                        ? new Date(detail.order.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')
                        : ''}
                      {detail.order.isGuest ? ' · Guest checkout' : ' · Registered customer'}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusPill status={detail.order.status} />
                      <span style={{
                        padding: '4px 10px', borderRadius: '999px', fontSize: '11px',
                        fontWeight: 800, backgroundColor: '#262626', color: '#E5E7EB',
                      }}>
                        {detail.order.paymentStatus}
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: '999px', fontSize: '11px',
                        fontWeight: 800, backgroundColor: '#262626', color: '#E5E7EB',
                      }}>
                        {detail.order.deliveryStatus}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDetail(null); setConfirming(null); }}
                    style={{
                      background: 'none', border: 'none', color: '#ffffff',
                      cursor: 'pointer', padding: '4px',
                    }}
                    aria-label="Close"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div style={{ padding: '20px 24px 48px 24px' }}>
                  {actionError && (
                    <div ref={errorRef} style={{
                      padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
                      backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                      color: '#B91C1C', fontSize: '12px', fontWeight: 700,
                    }}>
                      {actionError}
                    </div>
                  )}

                  {/* ---- Status actions ---- */}
                  <section style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <ClipboardList size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                      Order actions
                    </h3>

                    {(detail.order.allowedTransitions || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        This order is in a final state; no further status changes are possible.
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          placeholder="Optional note recorded against this change…"
                          rows={2}
                          style={{
                            width: '100%', borderRadius: '8px', border: '1px solid #D1D5DB',
                            padding: '10px 12px', fontSize: '13px', resize: 'vertical',
                            marginBottom: '12px', fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(detail.order.allowedTransitions || []).map(status => {
                            const destructive = DESTRUCTIVE.includes(status);
                            return (
                              <button
                                key={status}
                                onClick={() => requestTransition(status)}
                                disabled={busy}
                                style={{
                                  backgroundColor: destructive ? '#ffffff' : '#111827',
                                  color: destructive ? '#B91C1C' : '#ffffff',
                                  border: destructive ? '1px solid #FECACA' : 'none',
                                  borderRadius: '8px', padding: '10px 16px',
                                  fontSize: '12px', fontWeight: 700,
                                  cursor: busy ? 'wait' : 'pointer',
                                }}
                              >
                                {ACTION_LABEL[status] || status}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={addNote}
                        disabled={busy || !actionNote.trim()}
                        style={{
                          backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
                          borderRadius: '8px', padding: '9px 14px', fontSize: '12px',
                          fontWeight: 700, color: '#374151',
                          cursor: busy || !actionNote.trim() ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <StickyNote size={12} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                        Save as internal note
                      </button>
                    </div>
                  </section>

                  {/* ---- Customer & delivery ---- */}
                  <section style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Customer &amp; delivery
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                      <div><div style={labelStyle}>Name</div>{detail.order.customerName}</div>
                      <div><div style={labelStyle}>Email</div>{detail.order.customerEmail || '—'}</div>
                      <div><div style={labelStyle}>Phone</div>{detail.order.customerPhone || '—'}</div>
                      <div><div style={labelStyle}>City</div>{detail.order.city}</div>
                      <div><div style={labelStyle}>District</div>{detail.order.district || '—'}</div>
                      <div><div style={labelStyle}>Postal code</div>{detail.order.postalCode || '—'}</div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={labelStyle}>Address</div>{detail.order.address}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={labelStyle}>Country</div>{detail.order.country || 'Saudi Arabia'}
                      </div>
                    </div>
                  </section>

                  {/* ---- Items ---- */}
                  <section style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <Package size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                      Items ({detail.items.length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '8px 6px' }}>SKU</th>
                            <th style={{ padding: '8px 6px' }}>Product</th>
                            <th style={{ padding: '8px 6px' }}>Unit</th>
                            <th style={{ padding: '8px 6px' }}>Qty</th>
                            <th style={{ padding: '8px 6px' }}>Line total</th>
                            <th style={{ padding: '8px 6px' }}>Stock now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '10px 6px', fontFamily: 'monospace', fontSize: '11px' }}>
                                {item.sku || '—'}
                              </td>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 600, color: '#111827' }}>{item.nameEn}</div>
                                {item.brandName && (
                                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{item.brandName}</div>
                                )}
                                <div style={{ fontSize: '10px', color: '#D1D5DB', fontFamily: 'monospace' }}>
                                  {item.productId}
                                </div>
                              </td>
                              <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>{formatSar(item.unitPrice, lang)}</td>
                              <td style={{ padding: '10px 6px', fontWeight: 700 }}>{item.quantity}</td>
                              <td style={{ padding: '10px 6px', fontWeight: 800, whiteSpace: 'nowrap' }}>{formatSar(item.lineTotal, lang)}</td>
                              <td style={{ padding: '10px 6px', color: (item.currentStock ?? 0) <= 0 ? '#B91C1C' : '#6B7280' }}>
                                {item.currentStock ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px solid #E5E7EB', paddingTop: '12px', fontSize: '13px' }}>
                      {[
                        ['Subtotal', formatSar(detail.order.subtotal, lang)],
                        ...(detail.order.discount
                          ? [[`Discount${detail.order.discountCode ? ` (${detail.order.discountCode})` : ''}`, `−${formatSar(detail.order.discount, lang)}`]]
                          : []),
                        ['Shipping', detail.order.shipping === 0 ? 'FREE' : formatSar(detail.order.shipping, lang)],
                        [`VAT (${detail.order.vatPercent ?? 15}%)`, formatSar(detail.order.vat, lang)],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4B5563' }}>
                          <span>{label}</span>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '10px',
                        fontSize: '16px', fontWeight: 800, color: '#111827',
                      }}>
                        <span>Payable total</span>
                        <span>{formatSar(detail.order.total, lang)}</span>
                      </div>
                      {(detail.order.refunded || 0) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', color: '#1D4ED8', fontWeight: 700 }}>
                          <span>Refunded</span>
                          <span>−{formatSar(detail.order.refunded || 0, lang)}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ---- Payments ---- */}
                  <section style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <CreditCard size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                      Payments
                    </h3>

                    {detail.payments.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>No payment attempt recorded.</div>
                    ) : detail.payments.map(payment => (
                      <div key={payment.id} style={{
                        border: '1px solid #E5E7EB', borderRadius: '10px',
                        padding: '12px 14px', marginBottom: '8px', fontSize: '12px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#111827' }}>
                              {payment.provider} · {payment.method}
                              {payment.isTestMode && (
                                <span style={{
                                  marginLeft: '8px', padding: '2px 7px', borderRadius: '4px',
                                  backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '10px',
                                }}>
                                  TEST MODE
                                </span>
                              )}
                            </div>
                            <div style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '11px', marginTop: '3px' }}>
                              {payment.providerPaymentId || 'no provider reference'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800 }}>{formatSar(payment.amount, lang)}</div>
                            <div style={{
                              fontSize: '11px', fontWeight: 800,
                              color: payment.status === 'PAID' ? '#047857'
                                : payment.status.includes('REFUND') ? '#1D4ED8' : '#B91C1C',
                            }}>
                              {payment.status}
                            </div>
                          </div>
                        </div>
                        {payment.verifiedAt && (
                          <div style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '6px' }}>
                            Verified server-side {new Date(payment.verifiedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                          </div>
                        )}
                        {payment.failureReason && (
                          <div style={{ color: '#B91C1C', fontSize: '11px', marginTop: '6px' }}>
                            {payment.failureReason}
                          </div>
                        )}
                      </div>
                    ))}

                    {detail.refunds.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={labelStyle}>Refunds</div>
                        {detail.refunds.map(refund => (
                          <div key={refund.id} style={{ fontSize: '12px', color: '#374151', padding: '4px 0' }}>
                            <Undo2 size={11} style={{ verticalAlign: '-1px', marginRight: '5px' }} />
                            {formatSar(refund.amount, lang)} · {refund.status}
                            {refund.reason ? ` · ${refund.reason}` : ''}
                            <span style={{ color: '#9CA3AF' }}>
                              {' '}· {new Date(refund.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {detail.order.paymentStatus !== 'Pending' &&
                     detail.payments.some(p => ['PAID', 'PARTIALLY_REFUNDED'].includes(p.status)) && (
                      <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                        {!refundOpen ? (
                          <button
                            onClick={() => { setRefundOpen(true); setActionError(null); }}
                            style={{
                              backgroundColor: '#ffffff', color: '#B91C1C',
                              border: '1px solid #FECACA', borderRadius: '8px',
                              padding: '9px 16px', fontSize: '12px', fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Refund payment…
                          </button>
                        ) : (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            <div>
                              <label style={labelStyle}>
                                Amount (max {formatSar(Math.max(0, detail.order.total - (detail.order.refunded || 0)), lang)})
                              </label>
                              <input
                                type="number" step="0.01" min="0"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                style={{ ...inputStyle, width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Reason</label>
                              <input
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Damaged on arrival, customer cancelled…"
                                style={{ ...inputStyle, width: '100%' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={submitRefund}
                                disabled={busy}
                                style={{
                                  backgroundColor: '#B91C1C', color: '#ffffff', border: 'none',
                                  borderRadius: '8px', padding: '10px 18px', fontSize: '12px',
                                  fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
                                }}
                              >
                                {busy ? 'Processing…' : 'Send refund'}
                              </button>
                              <button
                                onClick={() => setRefundOpen(false)}
                                style={{
                                  backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
                                  borderRadius: '8px', padding: '10px 18px', fontSize: '12px',
                                  fontWeight: 700, color: '#374151', cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* ---- Shipping details ---- */}
                  <section style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <Truck size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                      Shipping &amp; tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Tracking number</label>
                        <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="SMSA-123456789" style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Carrier</label>
                        <input value={carrier} onChange={(e) => setCarrier(e.target.value)}
                          placeholder="SMSA Express" style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input value={editCity} onChange={(e) => setEditCity(e.target.value)}
                          style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Postal code</label>
                        <input value={editPostal} onChange={(e) => setEditPostal(e.target.value)}
                          placeholder="12345" style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Address</label>
                        <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                          style={{ ...inputStyle, width: '100%' }} />
                      </div>
                    </div>
                    <button
                      onClick={saveFulfilment}
                      disabled={busy}
                      style={{
                        marginTop: '14px', backgroundColor: BRAND_RED, color: '#ffffff',
                        border: 'none', borderRadius: '8px', padding: '10px 20px',
                        fontSize: '12px', fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
                      }}
                    >
                      {busy ? 'Saving…' : 'Save shipping details'}
                    </button>
                  </section>

                  {/* ---- Internal notes ---- */}
                  {detail.order.internalNotes && (
                    <section style={{ ...card, marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Internal notes
                      </h3>
                      <pre style={{
                        margin: 0, fontSize: '12px', color: '#374151',
                        whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6,
                      }}>
                        {detail.order.internalNotes}
                      </pre>
                    </section>
                  )}

                  {/* ---- History ---- */}
                  <section style={card}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Order history ({detail.events.length})
                    </h3>
                    {detail.events.slice().reverse().map(event => (
                      <div key={event.id} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                          marginTop: '6px',
                          backgroundColor: event.eventType.includes('FAIL') || event.eventType.includes('MISMATCH') || event.eventType.includes('SHORTFALL')
                            ? '#B91C1C' : BRAND_RED,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            {event.eventType.replace(/_/g, ' ')}
                            {event.from && event.to ? ` · ${event.from} → ${event.to}` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: '#111827', marginTop: '2px' }}>
                            {event.message}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                            {new Date(event.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                            {event.actorName ? ` · ${event.actorName}` : ''}
                            {event.isInternal ? ' · internal' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= Confirmation dialog ================= */}
      {confirming && detail && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '14px', padding: '26px',
            maxWidth: '460px', width: '100%',
          }}>
            <div style={{ color: '#B91C1C', marginBottom: '12px' }}><AlertTriangle size={30} /></div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
              {confirming.label}?
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 6px 0', lineHeight: 1.6 }}>
              Order <strong>{detail.order.orderNumber}</strong> · {formatSar(detail.order.total, lang)}
            </p>
            <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 16px 0', lineHeight: 1.6 }}>
              {confirming.warning}
            </p>

            <label style={labelStyle}>Reason (recorded in the order history)</label>
            <input
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              placeholder="Out of stock, customer request…"
              style={{ ...inputStyle, width: '100%', marginBottom: '18px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirming(null)}
                style={{
                  backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
                  borderRadius: '8px', padding: '11px 20px', fontSize: '13px',
                  fontWeight: 700, color: '#374151', cursor: 'pointer',
                }}
              >
                Keep as is
              </button>
              <button
                onClick={() => applyTransition(confirming.status, confirmReason.trim() || undefined)}
                disabled={busy}
                style={{
                  backgroundColor: '#B91C1C', color: '#ffffff', border: 'none',
                  borderRadius: '8px', padding: '11px 20px', fontSize: '13px',
                  fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
                }}
              >
                {busy ? 'Working…' : `Yes, ${confirming.label.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
