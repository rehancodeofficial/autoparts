import React, { useState } from 'react';
import { Part, Vehicle } from '../types';
import { checkFitment } from '../utils/searchEngine';
import { X, CheckCircle2, AlertCircle, ShoppingBag, ShieldCheck, RotateCcw, Package, Star } from 'lucide-react';

interface PartModalProps {
  part: Part | null;
  selectedVehicle: Vehicle | null;
  onClose: () => void;
  onAddToCart: (part: Part) => void;
  lang: 'en' | 'ar';
}

export const PartModal: React.FC<PartModalProps> = ({
  part,
  selectedVehicle,
  onClose,
  onAddToCart,
  lang
}) => {
  if (!part) return null;
  const [selectedImg, setSelectedImg] = useState(0);
  const fitmentInfo = checkFitment(part, selectedVehicle);

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
      zIndex: 1000,
      padding: '24px'
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          padding: '32px'
        }}
      >
        {/* Close Circular Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: lang === 'en' ? '20px' : 'auto',
            left: lang === 'ar' ? '20px' : 'auto',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            backgroundColor: '#f2f4f5',
            border: 'none',
            color: '#000000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Images Section */}
          <div>
            <div style={{
              height: '340px',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              marginBottom: '12px'
            }}>
              <img
                src={part.images[selectedImg] || part.images[0]}
                alt={part.nameEn}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {part.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {part.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: selectedImg === idx ? '2px solid #5433eb' : '1px solid #ebebeb',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Warehouse Stock Card */}
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '20px',
              backgroundColor: '#f2f4f5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Package size={20} color="#000000" />
              <div>
                <div style={{ fontSize: '11px', color: '#787574', fontWeight: '500' }}>Warehouse Inventory</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#000000' }}>{part.warehouseLocation} ({part.stock} in stock)</div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#787574', letterSpacing: '-0.015em', marginBottom: '6px' }}>
              {part.brand} • {part.category}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.04em', lineHeight: '1.25', color: '#000000', marginBottom: '10px' }}>
              {lang === 'ar' ? part.nameAr : part.nameEn}
            </h2>

            {/* Star Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill="#000000" color="#000000" />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#787574', marginLeft: '4px' }}>
                {part.rating} ({part.reviewCount} reviews)
              </span>
            </div>

            {/* Fitment Banner */}
            {selectedVehicle && (
              <div style={{ marginBottom: '16px' }}>
                {fitmentInfo.fits ? (
                  <div className="pill-fit" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    <CheckCircle2 size={16} />
                    <span>{lang === 'ar' ? `متوافق 100% مع ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : `Guaranteed 100% Fit for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}</span>
                  </div>
                ) : (
                  <div className="pill-unfit" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    <AlertCircle size={16} />
                    <span>{lang === 'ar' ? `غير متوافق مع ${selectedVehicle.make} ${selectedVehicle.model}` : `Warning: Does not match your selected ${selectedVehicle.make} ${selectedVehicle.model}`}</span>
                  </div>
                )}
              </div>
            )}

            {/* Price Box */}
            <div style={{
              backgroundColor: '#f2f4f5',
              borderRadius: '20px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000' }}>
                  {part.price.toFixed(2)} SAR
                </div>
                <div style={{ fontSize: '11px', color: '#787574' }}>
                  {lang === 'ar' ? 'شامل ضريبة 15%' : 'Incl. 15% ZATCA VAT'}
                </div>
              </div>

              <button
                onClick={() => {
                  onAddToCart(part);
                  onClose();
                }}
                className="btn-shop-primary"
                style={{ padding: '12px 24px', borderRadius: '9999px', fontSize: '14px' }}
              >
                <ShoppingBag size={16} />
                <span>{lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
              </button>
            </div>

            {/* Specs Table */}
            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ebebeb' }}>
                <span style={{ color: '#787574' }}>OEM Number</span>
                <span style={{ fontWeight: '600', color: '#000000' }}>{part.oemNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ebebeb' }}>
                <span style={{ color: '#787574' }}>Internal SKU</span>
                <span style={{ color: '#000000' }}>{part.sku}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ebebeb' }}>
                <span style={{ color: '#787574' }}>Alternate Codes</span>
                <span style={{ color: '#787574' }}>{part.alternateNumbers.join(', ')}</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#332f2d', lineHeight: '1.5', marginBottom: '20px' }}>
              {lang === 'ar' ? part.descriptionAr : part.descriptionEn}
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', fontSize: '12px', color: '#787574' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#000000" />
                <span>{part.warranty}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={16} color="#000000" />
                <span>14-Day Free Returns</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
