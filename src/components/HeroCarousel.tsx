import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  image: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  ctaAction: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  badge?: { title: string; subtitle: string; detail: string };
}

interface HeroCarouselProps {
  lang: 'en' | 'ar';
  onShopNow: () => void;
  onExploreCatalog?: () => void;
  onRequestPart?: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ lang, onShopNow, onExploreCatalog, onRequestPart }) => {
  const slides: SlideData[] = [
    {
      image: '/hero/slide1.jpg',
      eyebrow: '— OFFICIAL OEM & PERFORMANCE STORE —',
      headline: 'MAXIMUM TORQUE &\nRACING PRECISION',
      subtitle: 'Upgrade your ride with high-flow intakes, coilover systems, and Brembo big brake kits with guaranteed vehicle fitment across Saudi Arabia.',
      ctaLabel: 'EXPLORE PERFORMANCE CATALOG',
      ctaAction: onShopNow,
      secondaryLabel: 'ORDER BY PART # / VIN',
      secondaryAction: onRequestPart,
      badge: { title: 'GCC RACING SPEC', subtitle: 'Genuine Parts Guaranteed', detail: 'Direct warehouse distribution in Riyadh & Jeddah' },
    },
    {
      image: '/hero/slide2.jpg',
      eyebrow: '— TURBO & ENGINE UPGRADES —',
      headline: 'UNLEASH HIDDEN\nHORSEPOWER',
      subtitle: 'Garrett turbos, HKS exhaust systems, and forged internals — every part dyno-verified and shipped with OEM-grade warranty.',
      ctaLabel: 'SHOP TURBO KITS',
      ctaAction: onShopNow,
      badge: { title: 'DYNO TESTED', subtitle: '500+ HP Builds Available', detail: 'Professional installation partners across KSA' },
    },
    {
      image: '/hero/slide3.jpg',
      eyebrow: '— FREE DELIVERY ACROSS KSA —',
      headline: 'BUILT FOR THE\nDESERT TRACK',
      subtitle: 'Heat-resistant brake fluid, high-temp ceramic pads, and sand-sealed air filters — engineered for GCC conditions.',
      ctaLabel: 'SHOP DESERT-RATED PARTS',
      ctaAction: onShopNow,
      secondaryLabel: 'VIN LOOKUP',
      secondaryAction: onRequestPart,
      badge: { title: 'GCC RATED', subtitle: 'Desert-Proven Quality', detail: 'Tested at 55°C ambient conditions' },
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  // Auto-advance every 2.5 seconds (2-3 seconds as requested)
  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(nextSlide, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlide];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff',
        minHeight: '480px',
      }}
    >
      {/* ─── Background Image Layers (slide & scale crossfade) ─── */}
      {slides.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === currentSlide ? 1 : 0,
            transform: i === currentSlide ? 'scale(1.03)' : 'scale(1)',
            transition: 'opacity 0.6s ease-in-out, transform 2.5s ease-out',
            zIndex: 0,
          }}
        />
      ))}

      {/* ─── Dark Gradient Overlay for text legibility ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)',
        zIndex: 1,
      }} />

      {/* ─── Accent Gradient Overlay (brand red tint) ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(212, 43, 43, 0.35) 0%, transparent 60%)',
        zIndex: 1,
      }} />

      {/* ─── Content ─── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px 100px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '480px',
      }}>
        {/* Left Column: Text Content */}
        <div style={{
          maxWidth: '580px',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '10px',
          }}>
            {slide.eyebrow}
          </div>

          <h1 style={{
            fontSize: '44px',
            lineHeight: '50px',
            fontWeight: 900,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '14px',
            whiteSpace: 'pre-line',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            {slide.headline}
          </h1>

          <p style={{
            fontSize: '15px',
            lineHeight: '22px',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '26px',
          }}>
            {slide.subtitle}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onShopNow}
              style={{
                backgroundColor: '#ffffff',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 32px',
                fontSize: '13px',
                fontWeight: 800,
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1.05)';
                (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1)';
                (e.target as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
              }}
            >
              {lang === 'ar' ? 'تسوق الآن' : 'SHOP NOW'}
            </button>

            <button
              onClick={onExploreCatalog || onShopNow}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.7)',
                borderRadius: '50px',
                padding: '12px 28px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = '#ffffff';
                (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)';
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {lang === 'ar' ? 'تصفح الكتالوج' : 'EXPLORE CATALOG'}
            </button>
          </div>
        </div>

        {/* Right Column: Badge + Navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '16px',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
          transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
        }}>
          {slide.badge && (
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '14px 22px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: '11px', color: '#FFB300', fontWeight: 800, textTransform: 'uppercase' }}>
                {slide.badge.title}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {slide.badge.subtitle}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                {slide.badge.detail}
              </div>
            </div>
          )}


        </div>
      </div>

      {/* ─── Dot Indicators ─── */}
      <div style={{
        position: 'absolute',
        bottom: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        display: 'flex',
        gap: '10px',
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === currentSlide ? '28px' : '10px',
              height: '10px',
              borderRadius: '5px',
              backgroundColor: i === currentSlide ? '#ffffff' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* ─── Progress Bar ─── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        zIndex: 3,
      }}>
        <div
          key={currentSlide}
          style={{
            height: '100%',
            backgroundColor: '#E53935',
            animation: isPaused ? 'none' : 'heroProgress 2.5s linear forwards',
            width: isPaused ? undefined : undefined,
          }}
        />
      </div>

      {/* Keyframe animation injected via style tag */}
      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};
