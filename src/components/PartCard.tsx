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
      className="shop-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'relative'
      }}
    >
      {/* Product Image Area with inner 20px radius */}
      <div style={{
        position: 'relative',
        height: '240px',
        padding: '12px 12px 0 12px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
          position: 'relative'
        }}>
          <img
            src={part.images[0]}
            alt={part.nameEn}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />

          {/* Quick Details Floating Icon */}
          <button
            onClick={() => onViewDetails(part)}
            style={{
              position: 'absolute',
              top: '12px',
              right: lang === 'en' ? '12px' : 'auto',
              left: lang === 'ar' ? '12px' : 'auto',
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0.8,
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={16} color="#000000" />
          </button>

          {/* Stock Tag on Image */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: lang === 'en' ? '10px' : 'auto',
            right: lang === 'ar' ? '10px' : 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#000000',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}>
            {part.stock > 10 ? (lang === 'ar' ? 'متوفر' : 'In Stock') : (lang === 'ar' ? `متبقي ${part.stock}` : `${part.stock} left`)}
          </div>
        </div>
      </div>

      {/* Card Body with Shop typography */}
      <div style={{ padding: '16px 20px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Brand & OEM Reference */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#787574', letterSpacing: '-0.017em' }}>
            {part.brand}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#787574',
            backgroundColor: '#f2f4f5',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: '500'
          }}>
            {part.oemNumber}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(part)}
          style={{
            fontSize: '15px',
            fontWeight: '600',
            letterSpacing: '-0.025em',
            color: '#000000',
            lineHeight: '1.3',
            marginBottom: '8px',
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {lang === 'ar' ? part.nameAr : part.nameEn}
        </h3>

        {/* Rating row (Shop style 9px caption with tight tracking) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} fill="#000000" color="#000000" />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: '#787574', letterSpacing: '-0.02em', marginLeft: '2px' }}>
            {part.rating} ({part.reviewCount})
          </span>
        </div>

        {/* Fitment Status Pill */}
        {selectedVehicle && (
          <div style={{ marginBottom: '14px' }}>
            {fitmentInfo.fits ? (
              <span className="pill-fit">
                <CheckCircle2 size={13} />
                <span>{lang === 'ar' ? `يناسب ${selectedVehicle.model}` : `Fits ${selectedVehicle.year} ${selectedVehicle.model}`}</span>
              </span>
            ) : (
              <span className="pill-unfit">
                <AlertCircle size={13} />
                <span>{lang === 'ar' ? `لا يناسب ${selectedVehicle.model}` : `Does not fit ${selectedVehicle.model}`}</span>
              </span>
            )}
          </div>
        )}

        {/* Price & Action Row */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000' }}>
              {part.price.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: '500', color: '#787574' }}>SAR</span>
            </div>
            {part.originalPrice && (
              <div style={{ fontSize: '12px', color: '#787574', textDecoration: 'line-through' }}>
                {part.originalPrice.toFixed(2)} SAR
              </div>
            )}
          </div>

          <button
            onClick={() => onAddToCart(part)}
            className="btn-shop-pill"
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            <ShoppingBag size={14} />
            <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
