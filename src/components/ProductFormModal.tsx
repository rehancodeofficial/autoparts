import React, { useState } from 'react';
import { Part, VehicleMake, VehicleModel, PartCategory, PartBrand, QualityGradeConfig } from '../types';
import { 
  X, Check, Plus, Trash2, Shield, AlertCircle, 
  HelpCircle, Car, Sparkles, Image as ImageIcon, DollarSign, 
  Layers, Info, FileText 
} from 'lucide-react';

interface ProductFormModalProps {
  initialProduct?: Part | null;
  makes: VehicleMake[];
  categories: PartCategory[];
  brands: PartBrand[];
  qualityGrades: QualityGradeConfig[];
  onClose: () => void;
  onSaveSuccess: () => void;
  lang: 'en' | 'ar';
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  makes,
  categories,
  brands,
  qualityGrades,
  onClose,
  onSaveSuccess,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'fitment' | 'quality' | 'specs' | 'pricing' | 'images'>('basic');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Section A: Basic
  const [nameEn, setNameEn] = useState(initialProduct?.nameEn || '');
  const [nameAr, setNameAr] = useState(initialProduct?.nameAr || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [mpn, setMpn] = useState(initialProduct?.mpn || '');
  const [oemNumber, setOemNumber] = useState(initialProduct?.oemNumber || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || (categories[0]?.id || ''));
  const [brandId, setBrandId] = useState(initialProduct?.brandId || (brands[0]?.id || ''));
  const [shortDescEn, setShortDescEn] = useState(initialProduct?.shortDescriptionEn || '');
  const [descEn, setDescEn] = useState(initialProduct?.descriptionEn || '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'DISABLED'>(initialProduct?.status as any || 'PUBLISHED');

  // Section B: Fitment Records (Verified in PostgreSQL)
  const [fitments, setFitments] = useState<any[]>(
    initialProduct?.fitments?.map(f => ({
      makeId: f.makeId || makes.find(m => m.name === f.make)?.id || makes[0]?.id,
      makeName: f.make,
      modelId: f.modelId || '',
      modelName: f.model,
      yearNumber: f.years?.[0] || 2022,
      note: f.notes || 'All engine trims'
    })) || [
      { makeId: makes[0]?.id, makeName: makes[0]?.name, modelId: '', modelName: '', yearNumber: 2022, note: 'All engine trims' }
    ]
  );

  // Section C: Quality & Condition
  const [qualityGrade, setQualityGrade] = useState(initialProduct?.qualityGrade || 'GRADE_A');
  const [condition, setCondition] = useState(initialProduct?.condition || 'NEW');
  const [isOem, setIsOem] = useState(initialProduct?.isOem ?? true);
  const [isOriginal, setIsOriginal] = useState(initialProduct?.isOriginal ?? true);
  const [testedStatus, setTestedStatus] = useState(initialProduct?.testedStatus || 'TESTED_VERIFIED');
  const [warrantyMonths, setWarrantyMonths] = useState(initialProduct?.warrantyMonths || 12);
  const [returnEligible, setReturnEligible] = useState(initialProduct?.returnEligible ?? true);

  // Section D: Specs
  const [installationPosition, setInstallationPosition] = useState(initialProduct?.installationPosition || 'Front Axle');
  const [specOrigin, setSpecOrigin] = useState(initialProduct?.specifications?.['Origin'] || 'Japan');
  const [specMaterial, setSpecMaterial] = useState(initialProduct?.specifications?.['Material'] || 'Ceramic OEM standard');

  // Section E: Pricing & Inventory
  const [sellingPrice, setSellingPrice] = useState(initialProduct?.price || 150);
  const [salePrice, setSalePrice] = useState<number | ''>(initialProduct?.salePrice || '');
  const [costPrice, setCostPrice] = useState<number | ''>(initialProduct?.costPrice || 90);
  const [stockQuantity, setStockQuantity] = useState(initialProduct?.stock || 25);
  const [warehouseLocation, setWarehouseLocation] = useState(initialProduct?.warehouseLocation || 'Riyadh Central (Bin A-14)');

  // Section F: Images
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialProduct?.images?.length ? initialProduct.images : ['https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80']
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddFitment = () => {
    setFitments(prev => [
      ...prev,
      { makeId: makes[0]?.id, makeName: makes[0]?.name, modelId: '', modelName: '', yearNumber: 2022, note: '' }
    ]);
  };

  const handleRemoveFitment = (index: number) => {
    setFitments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !nameEn.trim()) {
      setErrorMsg('SKU and English Product Name are required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      id: initialProduct?.id,
      sku: sku.trim(),
      mpn: mpn.trim() || null,
      oemNumber: oemNumber.trim() || null,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim() || nameEn.trim(),
      shortDescriptionEn: shortDescEn.trim() || null,
      descriptionEn: descEn.trim() || null,
      categoryId,
      brandId,
      qualityGrade,
      condition,
      isOem,
      isOriginal,
      testedStatus,
      warrantyMonths: Number(warrantyMonths),
      returnEligible,
      sellingPrice: Number(sellingPrice),
      salePrice: salePrice !== '' ? Number(salePrice) : null,
      costPrice: costPrice !== '' ? Number(costPrice) : null,
      stockQuantity: Number(stockQuantity),
      warehouseLocation,
      installationPosition,
      technicalSpecs: {
        'Origin': specOrigin,
        'Material': specMaterial,
        'Position': installationPosition
      },
      status,
      images: imageUrls,
      fitments: fitments.map(f => ({
        makeId: f.makeId,
        modelId: f.modelId || 'model-camry',
        yearNumber: Number(f.yearNumber) || 2022,
        fitmentNote: f.note || null
      }))
    };

    try {
      const url = initialProduct?.id ? `/api/admin/products/${initialProduct.id}` : '/api/admin/products';
      const method = initialProduct?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product in database');
      }

      onSaveSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div className="shop-card" style={{
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #ebebeb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.03em', margin: 0, color: '#000000' }}>
              {initialProduct ? `Edit Product: ${initialProduct.nameEn}` : 'Add New Automotive Product'}
            </h2>
            <div style={{ fontSize: '12px', color: '#787574', marginTop: '2px' }}>
              PostgreSQL persistent automotive catalog & verified fitment mapping
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={20} color="#787574" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '10px 24px',
          borderBottom: '1px solid #f2f4f5',
          backgroundColor: '#fafafa',
          overflowX: 'auto'
        }}>
          {[
            { id: 'basic', label: '1. Basic Info', icon: FileText },
            { id: 'fitment', label: '2. Vehicle Fitment', icon: Car },
            { id: 'quality', label: '3. Quality & Grade', icon: Shield },
            { id: 'specs', label: '4. Tech Specs', icon: Layers },
            { id: 'pricing', label: '5. Price & Stock', icon: DollarSign },
            { id: 'images', label: '6. Images', icon: ImageIcon },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  backgroundColor: isActive ? '#000000' : 'transparent',
                  color: isActive ? '#ffffff' : '#787574',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', backgroundColor: '#feeae9', color: '#d92d20', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            
            {/* TAB 1: BASIC INFO */}
            {activeTab === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Internal SKU *</label>
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="e.g. BRK-TOY-04465" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>OEM / Genuine Part #</label>
                  <input type="text" value={oemNumber} onChange={(e) => setOemNumber(e.target.value)} placeholder="e.g. 04465-33471" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Manufacturer Part # (MPN)</label>
                  <input type="text" value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="e.g. D1212-8332" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Category *</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn} ({c.nameAr})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Part Brand *</label>
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Publication Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    <option value="PUBLISHED">Published (Visible in Store)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Product Title (English) *</label>
                  <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required placeholder="e.g. Ceramic Front Brake Pads Set" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Product Title (Arabic)</label>
                  <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="طقم أقمشة فرامل سيراميك أمامية" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Short Description</label>
                  <textarea rows={2} value={shortDescEn} onChange={(e) => setShortDescEn(e.target.value)} placeholder="Brief summary for catalog cards" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>
              </div>
            )}

            {/* TAB 2: VEHICLE FITMENT */}
            {activeTab === 'fitment' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Verified Vehicle Fitments</h4>
                    <p style={{ fontSize: '12px', color: '#787574', margin: '2px 0 0' }}>
                      Associate this part with specific vehicle makes and models in PostgreSQL.
                    </p>
                  </div>
                  <button type="button" onClick={handleAddFitment} className="btn-shop-pill" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Plus size={13} />
                    <span>Add Fitment</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {fitments.map((fit, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1.5fr auto', gap: '8px', alignItems: 'center', padding: '12px', backgroundColor: '#f9f9fa', borderRadius: '12px' }}>
                      <select
                        value={fit.makeId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFitments(prev => prev.map((f, i) => i === idx ? { ...f, makeId: val, makeName: makes.find(m => m.id === val)?.name } : f));
                        }}
                        className="shop-input"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      >
                        {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>

                      <input
                        type="text"
                        value={fit.modelName || 'Camry'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFitments(prev => prev.map((f, i) => i === idx ? { ...f, modelName: val } : f));
                        }}
                        placeholder="Model name"
                        className="shop-input"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      />

                      <input
                        type="number"
                        value={fit.yearNumber || 2022}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFitments(prev => prev.map((f, i) => i === idx ? { ...f, yearNumber: val } : f));
                        }}
                        placeholder="Year"
                        className="shop-input"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      />

                      <input
                        type="text"
                        value={fit.note || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFitments(prev => prev.map((f, i) => i === idx ? { ...f, note: val } : f));
                        }}
                        placeholder="Fitment note / Trim"
                        className="shop-input"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveFitment(idx)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} color="#d92d20" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: QUALITY & GRADE */}
            {activeTab === 'quality' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Quality Tier Grade *</label>
                  <select value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    {qualityGrades.map(g => (
                      <option key={g.code} value={g.code}>{g.displayLabel} ({g.nameEn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Condition *</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    <option value="NEW">Brand New</option>
                    <option value="REFURBISHED">Certified Refurbished</option>
                    <option value="REMANUFACTURED">Remanufactured OEM</option>
                    <option value="USED">Inspected Used</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Tested Status</label>
                  <select value={testedStatus} onChange={(e) => setTestedStatus(e.target.value)} className="shop-input" style={{ width: '100%', padding: '10px 12px' }}>
                    <option value="TESTED_VERIFIED">Factory Tested & Passed</option>
                    <option value="BENCH_TESTED">Laboratory Bench Tested</option>
                    <option value="VISUAL_PASSED">Visual Inspection Passed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Warranty Period (Months)</label>
                  <input type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(Number(e.target.value))} className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px', paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isOem} onChange={(e) => setIsOem(e.target.checked)} />
                    <span>OEM Specification Standard</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isOriginal} onChange={(e) => setIsOriginal(e.target.checked)} />
                    <span>Original Equipment Manufacturer</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={returnEligible} onChange={(e) => setReturnEligible(e.target.checked)} />
                    <span>Eligible for 14-Day Return</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: SPECS */}
            {activeTab === 'specs' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Installation Position</label>
                  <input type="text" value={installationPosition} onChange={(e) => setInstallationPosition(e.target.value)} placeholder="e.g. Front Axle, Rear, Left" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Country of Origin</label>
                  <input type="text" value={specOrigin} onChange={(e) => setSpecOrigin(e.target.value)} placeholder="e.g. Japan, Germany, USA" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Material Composition</label>
                  <input type="text" value={specMaterial} onChange={(e) => setSpecMaterial(e.target.value)} placeholder="e.g. Ceramic, Aluminum" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>
              </div>
            )}

            {/* TAB 5: PRICING & INVENTORY */}
            {activeTab === 'pricing' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Selling Price (SAR) *</label>
                  <input type="number" step="0.5" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} required className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Sale / Discount Price (SAR)</label>
                  <input type="number" step="0.5" value={salePrice} onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')} placeholder="Optional promotional price" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Internal Cost Price (Admin Only)</label>
                  <input type="number" step="0.5" value={costPrice} onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')} placeholder="Confidential wholesale cost" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Stock Quantity *</label>
                  <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} required className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Warehouse Bin Location</label>
                  <input type="text" value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} placeholder="e.g. Riyadh Central (Bin C-12)" className="shop-input" style={{ width: '100%', padding: '10px 12px' }} />
                </div>
              </div>
            )}

            {/* TAB 6: IMAGES */}
            {activeTab === 'images' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="shop-input"
                    style={{ flex: 1, padding: '10px 12px' }}
                  />
                  <button type="button" onClick={handleAddImage} className="btn-shop-pill" style={{ padding: '8px 16px' }}>
                    Add Image
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {imageUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebebeb', aspectRatio: '1' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '9999px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                      {i === 0 && (
                        <span style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: '#000000', color: '#ffffff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #ebebeb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ fontSize: '12px', color: '#787574' }}>
              Step {['basic', 'fitment', 'quality', 'specs', 'pricing', 'images'].indexOf(activeTab) + 1} of 6
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn-shop-pill" style={{ padding: '10px 18px', fontSize: '13px' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-shop-primary"
                style={{ padding: '10px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>{saving ? 'Saving to Database...' : (initialProduct ? 'Update Product' : 'Create & Publish Product')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
