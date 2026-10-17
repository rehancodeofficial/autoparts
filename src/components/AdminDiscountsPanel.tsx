import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Trash2, Pencil, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Discount } from '../types';
import { apiGet, apiPost, apiPut, apiDelete, ApiError, formatSar } from '../utils/api';

interface AdminDiscountsPanelProps {
  lang: 'en' | 'ar';
}

const BRAND_RED = '#E53935';

const inputStyle: React.CSSProperties = {
  height: '38px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  padding: '0 12px',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
  width: '100%',
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

interface FormState {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  descriptionEn: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: '',
  type: 'PERCENT',
  value: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  perCustomerLimit: '',
  descriptionEn: '',
  isActive: true,
};

/** YYYY-MM-DD for a date input, from an ISO timestamp. */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function discountState(d: Discount): { label: string; bg: string; fg: string } {
  if (!d.isActive) return { label: 'Inactive', bg: '#F3F4F6', fg: '#6B7280' };
  const now = Date.now();
  if (d.startsAt && new Date(d.startsAt).getTime() > now) {
    return { label: 'Scheduled', bg: '#EFF6FF', fg: '#1D4ED8' };
  }
  if (d.endsAt && new Date(d.endsAt).getTime() < now) {
    return { label: 'Expired', bg: '#FEF2F2', fg: '#B91C1C' };
  }
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) {
    return { label: 'Limit reached', bg: '#FFF7ED', fg: '#C2410C' };
  }
  return { label: 'Live', bg: '#ECFDF5', fg: '#047857' };
}

export const AdminDiscountsPanel: React.FC<AdminDiscountsPanelProps> = ({ lang }) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<{ discounts: Discount[] }>('/api/admin/discounts');
      setDiscounts(result.discounts || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.isUnauthorized
          ? 'Your admin session has expired. Please sign in again.'
          : apiErr.message || 'Could not load discounts.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : '',
      maxDiscountAmount: d.maxDiscountAmount !== null ? String(d.maxDiscountAmount) : '',
      startsAt: toDateInput(d.startsAt),
      endsAt: toDateInput(d.endsAt),
      usageLimit: d.usageLimit !== null ? String(d.usageLimit) : '',
      perCustomerLimit: d.perCustomerLimit !== null ? String(d.perCustomerLimit) : '',
      descriptionEn: d.descriptionEn || '',
      isActive: d.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async () => {
    setFormError(null);

    // The server validates all of this too; these checks just save a round trip.
    const value = Number(form.value);
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(form.code.trim())) {
      setFormError('The code must be 3–64 characters: letters, numbers, hyphen or underscore.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Enter a discount value greater than zero.');
      return;
    }
    if (form.type === 'PERCENT' && value > 100) {
      setFormError('A percentage discount cannot exceed 100%.');
      return;
    }

    const payload: Record<string, any> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      perCustomerLimit: form.perCustomerLimit === '' ? null : Number(form.perCustomerLimit),
      descriptionEn: form.descriptionEn.trim() || null,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiPut(`/api/admin/discounts/${editing.id}`, payload);
        setNotice(`Discount ${payload.code} updated.`);
      } else {
        await apiPost('/api/admin/discounts', payload);
        setNotice(`Discount ${payload.code} created.`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError((err as ApiError).message || 'Could not save that discount.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: Discount) => {
    const message = d.usageCount > 0
      ? `"${d.code}" has been used on ${d.usageCount} order(s), so it will be deactivated rather than deleted — deleting it would break those order records.\n\nDeactivate it now?`
      : `Delete the discount code "${d.code}"? This cannot be undone.`;
    if (!window.confirm(message)) return;

    try {
      const result = await apiDelete<{ message?: string; deactivated?: boolean }>(
        `/api/admin/discounts/${d.id}`
      );
      setNotice(result?.message || (result?.deactivated ? `${d.code} deactivated.` : `${d.code} deleted.`));
      await load();
    } catch (err) {
      setError((err as ApiError).message || 'Could not remove that discount.');
    }
  };

  const toggleActive = async (d: Discount) => {
    try {
      await apiPut(`/api/admin/discounts/${d.id}`, { isActive: !d.isActive });
      setNotice(`${d.code} is now ${!d.isActive ? 'active' : 'inactive'}.`);
      await load();
    } catch (err) {
      setError((err as ApiError).message || 'Could not change that discount.');
    }
  };

  const card: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
            Discount Codes
          </h2>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
            Codes are validated and applied on the server at checkout, so they cannot be
            forged or edited in the browser.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
              borderRadius: '8px', padding: '9px 14px', fontSize: '12px',
              fontWeight: 700, color: '#374151', cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              backgroundColor: BRAND_RED, color: '#ffffff', border: 'none',
              borderRadius: '8px', padding: '9px 16px', fontSize: '12px',
              fontWeight: 800, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> New discount
          </button>
        </div>
      </div>

      {notice && (
        <div style={{
          margin: '14px 0', padding: '11px 14px', borderRadius: '8px',
          backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0',
          color: '#047857', fontSize: '12px', fontWeight: 700,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div style={{
          margin: '14px 0', padding: '11px 14px', borderRadius: '8px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          color: '#B91C1C', fontSize: '12px', fontWeight: 700,
        }}>
          <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
          Loading discounts…
        </div>
      ) : discounts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
          <Tag size={34} style={{ margin: '0 auto 8px auto', display: 'block', color: '#D1D5DB' }} />
          <div style={{ fontWeight: 700, color: '#374151' }}>No discount codes yet</div>
          <div style={{ fontSize: '12px' }}>Create one to start offering promotions at checkout.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Code</th>
                <th style={{ padding: '12px 14px' }}>Discount</th>
                <th style={{ padding: '12px 14px' }}>Conditions</th>
                <th style={{ padding: '12px 14px' }}>Window</th>
                <th style={{ padding: '12px 14px' }}>Used</th>
                <th style={{ padding: '12px 14px' }}>State</th>
                <th style={{ padding: '12px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => {
                const state = discountState(d);
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{d.code}</div>
                      {d.descriptionEn && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{d.descriptionEn}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: BRAND_RED, whiteSpace: 'nowrap' }}>
                      {d.type === 'PERCENT' ? `${d.value}%` : formatSar(d.value, lang)}
                      {d.maxDiscountAmount !== null && (
                        <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>
                          max {formatSar(d.maxDiscountAmount, lang)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#6B7280' }}>
                      {d.minOrderAmount > 0 ? <div>Min order {formatSar(d.minOrderAmount, lang)}</div> : <div>No minimum</div>}
                      {d.perCustomerLimit !== null && <div>{d.perCustomerLimit} per customer</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {d.startsAt ? new Date(d.startsAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB') : 'Now'}
                      {' → '}
                      {d.endsAt ? new Date(d.endsAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB') : 'No end'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                      {d.usageCount}{d.usageLimit !== null ? ` / ${d.usageLimit}` : ''}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: '999px',
                        backgroundColor: state.bg, color: state.fg,
                        fontSize: '11px', fontWeight: 800,
                      }}>
                        {state.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => toggleActive(d)}
                        title={d.isActive ? 'Deactivate' : 'Activate'}
                        style={{
                          backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
                          borderRadius: '6px', padding: '6px 10px', fontSize: '11px',
                          fontWeight: 700, color: '#374151', cursor: 'pointer', marginRight: '6px',
                        }}
                      >
                        {d.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => openEdit(d)}
                        title="Edit"
                        style={{
                          backgroundColor: '#111827', border: 'none', borderRadius: '6px',
                          padding: '6px 9px', cursor: 'pointer', marginRight: '6px',
                          color: '#ffffff', verticalAlign: 'middle',
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => remove(d)}
                        title="Delete"
                        style={{
                          backgroundColor: '#ffffff', border: '1px solid #FECACA',
                          borderRadius: '6px', padding: '6px 9px', cursor: 'pointer',
                          color: '#B91C1C', verticalAlign: 'middle',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit dialog */}
      {formOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', overflowY: 'auto',
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '14px', padding: '26px',
            maxWidth: '620px', width: '100%', maxHeight: '92vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {editing ? `Edit ${editing.code}` : 'New discount code'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                marginBottom: '16px', padding: '11px 14px', borderRadius: '8px',
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                color: '#B91C1C', fontSize: '12px', fontWeight: 700,
              }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE10"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENT' | 'FIXED' })}
                  style={inputStyle}
                >
                  <option value="PERCENT">Percentage off</option>
                  <option value="FIXED">Fixed amount off (SAR)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  {form.type === 'PERCENT' ? 'Percentage (1–100) *' : 'Amount in SAR *'}
                </label>
                <input
                  type="number" step={form.type === 'PERCENT' ? '1' : '0.01'} min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'PERCENT' ? '10' : '50.00'}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Maximum discount (SAR)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                  placeholder="No cap"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Minimum order (SAR)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Total uses allowed</label>
                <input
                  type="number" min="1" step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Uses per customer</label>
                <input
                  type="number" min="1" step="1"
                  value={form.perCustomerLimit}
                  onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
                  placeholder="Unlimited"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Starts</label>
                <input
                  type="date" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Ends</label>
                <input
                  type="date" value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Internal description</label>
                <input
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  placeholder="Ramadan campaign, newsletter promo…"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active — customers can use this code now
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
              <button
                onClick={() => setFormOpen(false)}
                style={{
                  backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB',
                  borderRadius: '8px', padding: '11px 20px', fontSize: '13px',
                  fontWeight: 700, color: '#374151', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  backgroundColor: BRAND_RED, color: '#ffffff', border: 'none',
                  borderRadius: '8px', padding: '11px 22px', fontSize: '13px',
                  fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create discount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
