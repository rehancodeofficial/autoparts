import React, { useState } from 'react';
import { PartCategory, PartBrand, QualityGradeConfig } from '../types';
import { Plus, X, Layers, Tag, Award, Edit2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface CategoryAndBrandManagerProps {
  categories: PartCategory[];
  brands: PartBrand[];
  qualityGrades: QualityGradeConfig[];
  onRefresh: () => void;
  lang: 'en' | 'ar';
}

export const CategoryAndBrandManager: React.FC<CategoryAndBrandManagerProps> = ({
  categories,
  brands,
  qualityGrades,
  onRefresh,
  lang,
}) => {
  const [subTab, setSubTab] = useState<'categories' | 'brands' | 'grades'>('categories');

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<PartCategory | null>(null);
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catDisplayOrder, setCatDisplayOrder] = useState(0);
  const [catPublished, setCatPublished] = useState(true);

  // Brand Modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<PartBrand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // Grade Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<QualityGradeConfig | null>(null);
  const [gradeNameEn, setGradeNameEn] = useState('');
  const [gradeDisplayLabel, setGradeDisplayLabel] = useState('');
  const [gradeDescEn, setGradeDescEn] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category handlers
  const openCreateCategory = () => {
    setEditingCat(null);
    setCatNameEn('');
    setCatNameAr('');
    setCatSlug('');
    setCatParentId('');
    setCatImageUrl('');
    setCatDisplayOrder(categories.length + 1);
    setCatPublished(true);
    setErrorMsg(null);
    setIsCatModalOpen(true);
  };

  const openEditCategory = (c: PartCategory) => {
    setEditingCat(c);
    setCatNameEn(c.nameEn);
    setCatNameAr(c.nameAr);
    setCatSlug(c.slug);
    setCatParentId(c.parentId || '');
    setCatImageUrl(c.imageUrl || '');
    setCatDisplayOrder(c.displayOrder);
    setCatPublished(c.isPublished);
    setErrorMsg(null);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const url = editingCat ? `/api/admin/categories/${editingCat.id}` : '/api/admin/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: catNameEn.trim(),
          nameAr: catNameAr.trim() || catNameEn.trim(),
          slug: catSlug.trim().toLowerCase() || catNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          parentId: catParentId || null,
          imageUrl: catImageUrl.trim() || null,
          displayOrder: Number(catDisplayOrder) || 0,
          isPublished: catPublished
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      setIsCatModalOpen(false);
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Brand handlers
  const openCreateBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandSlug('');
    setBrandLogoUrl('');
    setBrandDesc('');
    setErrorMsg(null);
    setIsBrandModalOpen(true);
  };

  const openEditBrand = (b: PartBrand) => {
    setEditingBrand(b);
    setBrandName(b.name);
    setBrandSlug(b.slug);
    setBrandLogoUrl(b.logoUrl || '');
    setBrandDesc(b.description || '');
    setErrorMsg(null);
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
      const method = editingBrand ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName.trim(),
          slug: brandSlug.trim().toLowerCase() || brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          logoUrl: brandLogoUrl.trim() || null,
          description: brandDesc.trim() || null,
          isPublished: true,
          isEnabled: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save brand');
      }

      setIsBrandModalOpen(false);
      setBrandName('');
      setBrandSlug('');
      setBrandLogoUrl('');
      setBrandDesc('');
      setEditingBrand(null);
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Delete brand "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete brand');
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete category');
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Grade handlers
  const openEditGrade = (g: QualityGradeConfig) => {
    setEditingGrade(g);
    setGradeNameEn(g.nameEn);
    setGradeDisplayLabel(g.displayLabel);
    setGradeDescEn(g.descriptionEn || '');
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quality-grades/${editingGrade.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: gradeNameEn,
          displayLabel: gradeDisplayLabel,
          descriptionEn: gradeDescEn
        })
      });
      if (res.ok) {
        setIsGradeModalOpen(false);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setSubTab('categories')}
          className={`shop-pill ${subTab === 'categories' ? 'active' : ''}`}
        >
          <Layers size={14} />
          <span>Part Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setSubTab('brands')}
          className={`shop-pill ${subTab === 'brands' ? 'active' : ''}`}
        >
          <Tag size={14} />
          <span>Part Brands ({brands.length})</span>
        </button>

        <button
          onClick={() => setSubTab('grades')}
          className={`shop-pill ${subTab === 'grades' ? 'active' : ''}`}
        >
          <Award size={14} />
          <span>Quality Grades (A / B / C)</span>
        </button>
      </div>

      {/* Categories View */}
      {subTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#787574', margin: 0 }}>
              Manage automotive part categories with custom icons, display order, and publication status.
            </p>
            <button onClick={openCreateCategory} className="btn-shop-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="shop-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                  <th style={{ padding: '10px' }}>Image</th>
                  <th style={{ padding: '10px' }}>Category Name</th>
                  <th style={{ padding: '10px' }}>Slug</th>
                  <th style={{ padding: '10px' }}>Products</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                    <td style={{ padding: '10px' }}>
                      <img src={c.imageUrl || 'https://via.placeholder.com/40'} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: '600', color: '#000000' }}>{c.nameEn}</div>
                      <div style={{ fontSize: '11px', color: '#787574' }}>{c.nameAr}</div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <code>/{c.slug}</code>
                    </td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>
                      {c.productCount || 0}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: c.isPublished ? '#e6f9ed' : '#feeae9',
                        color: c.isPublished ? '#0d8239' : '#d92d20'
                      }}>
                        {c.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => openEditCategory(c)} style={{ padding: '6px', border: '1px solid #ebebeb', borderRadius: '8px', background: '#ffffff', cursor: 'pointer' }} title="Edit Category">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete category "${c.nameEn}"?`)) {
                              try {
                                const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  onRefresh();
                                } else {
                                  const d = await res.json();
                                  alert(d.error || 'Failed to delete category');
                                }
                              } catch (err: any) {
                                alert(err.message || 'Error deleting category');
                              }
                            }
                          }}
                          style={{ padding: '6px 8px', border: '1px solid #feeae9', borderRadius: '8px', background: '#feeae9', color: '#d92d20', cursor: 'pointer', fontSize: '11px' }}
                          title="Delete Category"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brands View */}
      {subTab === 'brands' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#787574', margin: 0 }}>
              Distinguish vehicle manufacturers from aftermarket & replacement part brands (e.g. Denso, Bosch, Brembo, Advics).
            </p>
            <button onClick={openCreateBrand} className="btn-shop-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              <Plus size={14} />
              <span>Add Part Brand</span>
            </button>
          </div>

          <div className="shop-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                  <th style={{ padding: '10px' }}>Brand</th>
                  <th style={{ padding: '10px' }}>Slug</th>
                  <th style={{ padding: '10px' }}>Description</th>
                  <th style={{ padding: '10px' }}>Products</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                    <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {b.logoUrl ? <img src={b.logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <Tag size={16} />}
                      </div>
                      <div style={{ fontWeight: '600' }}>{b.name}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}><code>/{b.slug}</code></td>
                    <td style={{ padding: '12px 10px', color: '#787574', maxWidth: '300px' }}>{b.description || '—'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: '600' }}>{b.productCount || 0}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: '#e6f9ed', color: '#0d8239' }}>Active</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditBrand(b)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', color: '#374151' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(b.id, b.name)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quality Grades View */}
      {subTab === 'grades' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#787574', margin: 0 }}>
              Configurable 3-tier automotive quality grades. Separate from condition (new vs used).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {qualityGrades.map((g) => (
              <div key={g.code} className="shop-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: g.code === 'GRADE_A' ? '#000000' : g.code === 'GRADE_B' ? '#5433eb' : '#787574',
                    color: '#ffffff'
                  }}>
                    {g.code}
                  </span>
                  <button onClick={() => openEditGrade(g)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <Edit2 size={14} />
                  </button>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px', color: '#000000' }}>
                  {g.displayLabel}
                </h4>
                <div style={{ fontSize: '12px', color: '#787574', marginBottom: '12px' }}>
                  {g.nameEn}
                </div>
                <p style={{ fontSize: '12px', color: '#332f2d', margin: 0, lineHeight: 1.5 }}>
                  {g.descriptionEn || 'No custom description defined'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="shop-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                {editingCat ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div style={{ color: '#d92d20', fontSize: '12px', marginBottom: '12px' }}>{errorMsg}</div>}

            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>English Name *</label>
                <input type="text" value={catNameEn} onChange={(e) => setCatNameEn(e.target.value)} required className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Arabic Name *</label>
                <input type="text" value={catNameAr} onChange={(e) => setCatNameAr(e.target.value)} required className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Image URL</label>
                <input type="url" value={catImageUrl} onChange={(e) => setCatImageUrl(e.target.value)} placeholder="https://..." className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn-shop-pill" style={{ padding: '8px 14px' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-shop-primary" style={{ padding: '8px 16px' }}>{saving ? 'Saving...' : 'Save Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {isBrandModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="shop-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{editingBrand ? 'Edit Part Brand' : 'Add Part Brand'}</h3>
              <button onClick={() => setIsBrandModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBrand}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Brand Name *</label>
                <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} required className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Logo URL</label>
                <input type="url" value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} placeholder="https://..." className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <input type="text" value={brandDesc} onChange={(e) => setBrandDesc(e.target.value)} className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="btn-shop-pill" style={{ padding: '8px 14px' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-shop-primary" style={{ padding: '8px 16px' }}>{saving ? 'Saving...' : 'Save Brand'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {isGradeModalOpen && editingGrade && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="shop-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Configure {editingGrade.code}</h3>
              <button onClick={() => setIsGradeModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveGrade}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Display Label *</label>
                <input type="text" value={gradeDisplayLabel} onChange={(e) => setGradeDisplayLabel(e.target.value)} required className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea rows={3} value={gradeDescEn} onChange={(e) => setGradeDescEn(e.target.value)} className="shop-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsGradeModalOpen(false)} className="btn-shop-pill" style={{ padding: '8px 14px' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-shop-primary" style={{ padding: '8px 16px' }}>{saving ? 'Saving...' : 'Update Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
