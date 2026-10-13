import React, { useState } from 'react';
import { VehicleMake, VehicleModel, PartCategory, PartBrand, QualityGradeConfig } from '../types';
import { 
  Plus, Check, X, Shield, Layers, Eye, EyeOff, 
  Trash2, Edit2, AlertCircle, Sparkles, Image as ImageIcon, 
  ChevronRight, ArrowLeft 
} from 'lucide-react';

interface VehicleManufacturerManagerProps {
  makes: VehicleMake[];
  onRefresh: () => void;
  lang: 'en' | 'ar';
}

export const VehicleManufacturerManager: React.FC<VehicleManufacturerManagerProps> = ({
  makes,
  onRefresh,
  lang,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMake, setEditingMake] = useState<VehicleMake | null>(null);
  const [selectedMakeForModels, setSelectedMakeForModels] = useState<VehicleMake | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);

  // Model creation inside selected make
  const [modelName, setModelName] = useState('');
  const [modelSlug, setModelSlug] = useState('');
  const [modelGen, setModelGen] = useState('');
  const [modelYearsStr, setModelYearsStr] = useState('2020, 2021, 2022, 2023, 2024');
  const [modelsList, setModelsList] = useState<VehicleModel[]>([]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingMake(null);
    setName('');
    setSlug('');
    setLogoUrl('');
    setDescription('');
    setDisplayOrder(makes.length + 1);
    setIsPublished(true);
    setIsEnabled(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: VehicleMake) => {
    setEditingMake(m);
    setName(m.name);
    setSlug(m.slug);
    setLogoUrl(m.logoUrl || '');
    setDescription(m.description || '');
    setDisplayOrder(m.displayOrder);
    setIsPublished(m.isPublished);
    setIsEnabled(m.isEnabled);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Manufacturer name is required');
      return;
    }
    const finalSlug = slug.trim() ? slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setSaving(true);
    setErrorMsg(null);

    try {
      const url = editingMake ? `/api/admin/makes/${editingMake.id}` : '/api/admin/makes';
      const method = editingMake ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: finalSlug,
          logoUrl: logoUrl.trim() || null,
          description: description.trim() || null,
          displayOrder: Number(displayOrder) || 0,
          isPublished,
          isEnabled
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save manufacturer');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (m: VehicleMake) => {
    try {
      await fetch(`/api/admin/makes/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !m.isPublished })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMake = async (m: VehicleMake) => {
    if (!window.confirm(`Are you sure you want to delete manufacturer "${m.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/makes/${m.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete manufacturer');
        return;
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Manage Models under Make
  const openModelManager = async (m: VehicleMake) => {
    setSelectedMakeForModels(m);
    try {
      const res = await fetch(`/api/admin/makes/${m.id}/models`);
      if (res.ok) {
        const data = await res.json();
        setModelsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMakeForModels || !modelName.trim()) return;

    try {
      const yearsArr = modelYearsStr
        .split(',')
        .map(y => parseInt(y.trim(), 10))
        .filter(y => !isNaN(y));

      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          makeId: selectedMakeForModels.id,
          name: modelName.trim(),
          slug: (modelSlug || modelName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          generation: modelGen.trim() || null,
          years: yearsArr,
          isPublished: true
        })
      });

      if (res.ok) {
        setModelName('');
        setModelSlug('');
        setModelGen('');
        // Refresh models
        const updated = await fetch(`/api/admin/makes/${selectedMakeForModels.id}/models`).then(r => r.json());
        setModelsList(updated);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Header with Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.03em', margin: 0, color: '#000000' }}>
            {lang === 'ar' ? 'إدارة مصنعي السيارات (Vehicle Makes)' : 'Vehicle Manufacturers & Logos'}
          </h3>
          <p style={{ fontSize: '12px', color: '#787574', marginTop: '4px', marginBottom: 0 }}>
            {lang === 'ar' 
              ? 'التحكم بالشركات المصنعة المعروضة في واجهة المتجر وشعاراتها' 
              : 'Add, publish, reorder, or edit vehicle makes shown on the customer storefront'}
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-shop-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={14} />
          <span>{lang === 'ar' ? 'إضافة صانع سيارات' : 'Add Manufacturer'}</span>
        </button>
      </div>

      {/* Models View if selected */}
      {selectedMakeForModels ? (
        <div className="shop-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button 
              onClick={() => setSelectedMakeForModels(null)}
              className="btn-shop-pill"
              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
              <span>{lang === 'ar' ? 'الرجوع للمصنعين' : 'Back to Manufacturers'}</span>
            </button>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>
              {selectedMakeForModels.name} {lang === 'ar' ? 'موديلات سيارات' : 'Vehicle Models'}
            </div>
          </div>

          {/* Add Model Form */}
          <form onSubmit={handleAddModel} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', 
            gap: '12px', 
            alignItems: 'end',
            padding: '16px',
            backgroundColor: '#f9f9fa',
            borderRadius: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '4px' }}>
                Model Name (e.g. Camry)
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                className="shop-input"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '4px' }}>
                Generation (Optional)
              </label>
              <input
                type="text"
                value={modelGen}
                onChange={(e) => setModelGen(e.target.value)}
                placeholder="e.g. XV70"
                className="shop-input"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#787574', marginBottom: '4px' }}>
                Years (Comma-separated)
              </label>
              <input
                type="text"
                value={modelYearsStr}
                onChange={(e) => setModelYearsStr(e.target.value)}
                placeholder="2018, 2019, 2020"
                className="shop-input"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
              />
            </div>

            <button type="submit" className="btn-shop-primary" style={{ padding: '8px 16px', fontSize: '13px', height: '38px' }}>
              <Plus size={14} />
              <span>Add Model</span>
            </button>
          </form>

          {/* Models List Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                <th style={{ padding: '10px' }}>Model</th>
                <th style={{ padding: '10px' }}>Generation</th>
                <th style={{ padding: '10px' }}>Years Supported</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {modelsList.map((mdl) => (
                <tr key={mdl.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                  <td style={{ padding: '12px 10px', fontWeight: '600', color: '#000000' }}>{mdl.name}</td>
                  <td style={{ padding: '12px 10px', color: '#787574' }}>{mdl.generation || '—'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {mdl.years?.map(y => (
                        <span key={y.id || y.year} style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f2f4f5', fontSize: '11px', fontWeight: '600' }}>
                          {y.year}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: '#e6f9ed', color: '#0d8239' }}>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Manufacturers Table */}
      <div className="shop-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
              <th style={{ padding: '10px' }}>Logo</th>
              <th style={{ padding: '10px' }}>Name & Slug</th>
              <th style={{ padding: '10px' }}>Display Order</th>
              <th style={{ padding: '10px' }}>Models</th>
              <th style={{ padding: '10px' }}>Storefront Status</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {makes.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#f5f5f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '4px'
                  }}>
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt={m.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={18} color="#787574" />
                    )}
                  </div>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: '600', color: '#000000' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#787574' }}>slug: /{m.slug}</div>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  <span style={{ fontWeight: '600', color: '#000000' }}>#{m.displayOrder}</span>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  <button
                    onClick={() => openModelManager(m)}
                    className="btn-shop-pill"
                    style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600' }}
                  >
                    <span>{m.modelCount || 0} Models</span>
                    <ChevronRight size={12} />
                  </button>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  <button
                    onClick={() => handleTogglePublish(m)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: m.isPublished ? '#e6f9ed' : '#feeae9',
                      color: m.isPublished ? '#0d8239' : '#d92d20'
                    }}
                  >
                    {m.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{m.isPublished ? 'Published on Store' : 'Draft (Hidden)'}</span>
                  </button>
                </td>

                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(m)}
                      title="Edit manufacturer"
                      style={{ padding: '6px', border: '1px solid #ebebeb', borderRadius: '8px', background: '#ffffff', cursor: 'pointer' }}
                    >
                      <Edit2 size={13} color="#000000" />
                    </button>
                    <button
                      onClick={() => handleDeleteMake(m)}
                      title="Delete manufacturer"
                      style={{ padding: '6px', border: '1px solid #feeae9', borderRadius: '8px', background: '#fffbfa', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} color="#d92d20" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Manufacturer Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="shop-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.03em', margin: 0 }}>
                {editingMake ? 'Edit Vehicle Manufacturer' : 'Add Vehicle Manufacturer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#feeae9', color: '#d92d20', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveManufacturer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingMake) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Toyota, Honda, BMW"
                  required
                  className="shop-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                  Unique Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. toyota"
                  className="shop-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                  Logo Image URL
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... logo image link"
                  className="shop-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                />
                {logoUrl && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#787574' }}>Preview:</span>
                    <img src={logoUrl} alt="Preview" style={{ height: '32px', width: '32px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #ebebeb' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  className="shop-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Manufacturer summary..."
                  className="shop-input"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Publish on storefront</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                  />
                  <span>Active & Enabled</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-shop-pill"
                  style={{ padding: '10px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-shop-primary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  {saving ? 'Saving...' : (editingMake ? 'Save Changes' : 'Create Manufacturer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
