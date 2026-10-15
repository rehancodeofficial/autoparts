import React, { useState } from 'react';
import { Part, Vehicle } from '../types';
import { checkFitment } from '../utils/searchEngine';
import { CheckCircle2, AlertCircle, ShoppingBag, Eye, Star } from 'lucide-react';

interface PartCardProps {
  part: Part;
  selectedVehicle: Vehicle | null;
  onAddToCart: (part: Part) => void;
  onViewDetails: (part: Part) => void;
  lang: 'en' | 'ar';
}

export const PartCard: React.FC<PartCardProps> = ({
  part,
  selectedVehicle,
  onAddToCart,
  onViewDetails,
  lang
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const fitmentInfo = checkFitment(part, selectedVehicle);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Product Image Area */}
      <div style={{
        position: 'relative',
        height: '200px',
        backgroundColor: '#ffffff',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <img
          src={part.images[0]}
          alt={part.nameEn}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />

        {/* Red or Orange Badge top-left */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: lang === 'en' ? '10px' : 'auto',
          right: lang === 'ar' ? '10px' : 'auto',
          backgroundColor: '#FF6600',
          color: '#ffffff',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {part.stock < 10 ? (lang === 'ar' ? 'الأكثر طلباً' : 'HOT DEAL') : (lang === 'ar' ? 'جديد' : 'NEW')}
        </div>

        {/* Quick View Eye Icon */}
        <button
          onClick={() => onViewDetails(part)}
          title="Quick View"
          style={{
            position: 'absolute',
            top: '10px',
            right: lang === 'en' ? '10px' : 'auto',
            left: lang === 'ar' ? '10px' : 'auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Eye size={15} color="#1A1A1A" />
        </button>
      </div>

      {/* Card Content */}
      <div style={{ padding: '14px 16px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid #f5f5f5' }}>
        
        {/* Brand & MPN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {part.brand}
          </span>
          <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'monospace' }}>
            {part.oemNumber}
          </span>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onViewDetails(part)}
          style={{
            fontSize: '13px',
            lineHeight: '18px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '10px',
            cursor: 'pointer',
            height: '36px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {lang === 'ar' ? part.nameAr : part.nameEn}
        </h3>

        {/* Fitment Indicator */}
        <div style={{ marginBottom: '12px' }}>
          {selectedVehicle && fitmentInfo.fits ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#e6f9ed',
              color: '#0d8239',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <CheckCircle2 size={13} />
              <span>{lang === 'ar' ? `متوافق مع ${selectedVehicle.model}` : `Verified Fit: ${selectedVehicle.model}`}</span>
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f5f5f5',
              color: '#666666',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <CheckCircle2 size={12} color="#0d8239" />
              <span>{lang === 'ar' ? 'مطابقة برقم الهيكل متاحة' : 'OEM Direct Replacement'}</span>
            </span>
          )}
        </div>

        {/* Price & Add to Cart button */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#888888' }}>{lang === 'ar' ? 'السعر' : 'Price'}</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A' }}>
              SAR {part.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(part)}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease'
            }}
            className="hover:bg-red-600"
          >
            <ShoppingBag size={14} />
            <span>{lang === 'ar' ? 'أضف' : '+ ADD'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
