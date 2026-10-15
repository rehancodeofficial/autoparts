import React from 'react';
import { ShieldCheck, Truck, Headphones, Award, MapPin, CheckCircle } from 'lucide-react';

interface AboutUsPageProps {
  onNavigateHome: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onNavigateHome }) => {
  return (
    <main style={{ flex: 1, backgroundColor: '#F5F5F5' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1E1E1E 60%, #2A0A0A 100%)',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(229,57,53,0.1) 0%, transparent 55%), radial-gradient(circle at 80% 50%, rgba(229,57,53,0.07) 0%, transparent 55%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '3px', color: '#E53935', textTransform: 'uppercase', marginBottom: '14px' }}>
            ABOUT AUTOPARTS KSA
          </div>
          <h1 style={{ fontSize: '46px', fontWeight: 900, color: '#ffffff', margin: '0 0 18px 0', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Saudi Arabia's No.1<br />
            <span style={{ color: '#E53935' }}>Auto Parts</span> Destination
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>
            Delivering genuine OEM and performance parts across the Kingdom since 2018. Trusted by thousands of drivers from Riyadh to Jeddah.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#E53935', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {[
            { value: '50,000+', label: 'Parts In Stock' },
            { value: '25,000+', label: 'Happy Customers' },
            { value: '6+', label: 'Years In Business' },
            { value: '3', label: 'KSA Warehouses' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#E53935', textTransform: 'uppercase', marginBottom: '12px' }}>OUR STORY</div>
            <h2 style={{ fontSize: '34px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 20px 0', lineHeight: 1.2, textTransform: 'uppercase' }}>
              Built For Drivers,<br />By Drivers
            </h2>
            <p style={{ fontSize: '15px', color: '#555555', lineHeight: 1.8, marginBottom: '16px' }}>
              Autoparts KSA was founded in Riyadh in 2018 with one mission: to give Saudi drivers access to the world's best auto parts at fair prices, delivered fast. We started in a single warehouse with a handful of Toyota OEM parts and a deep passion for cars.
            </p>
            <p style={{ fontSize: '15px', color: '#555555', lineHeight: 1.8, marginBottom: '28px' }}>
              Today, we stock over 50,000 genuine parts and performance upgrades — from Brembo brakes to Garrett turbos — with same-day dispatch from our Riyadh, Jeddah, and Dammam warehouses.
            </p>
            <button
              onClick={onNavigateHome}
              style={{
                backgroundColor: '#E53935', color: '#ffffff', border: 'none',
                borderRadius: '50px', padding: '13px 32px', fontSize: '13px',
                fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.5px',
              }}
            >
              BROWSE OUR CATALOG
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { icon: <ShieldCheck size={26} />, title: '100% Genuine Parts', desc: 'Every part is authentic OEM or verified performance brand' },
              { icon: <Truck size={26} />, title: 'Fast KSA Delivery', desc: 'Same-day dispatch from 3 warehouses across the Kingdom' },
              { icon: <Headphones size={26} />, title: '7-Day Support', desc: 'Expert team via WhatsApp, phone and email' },
              { icon: <Award size={26} />, title: 'Warranty Included', desc: 'All parts carry manufacturer warranty and easy return' },
            ].map(item => (
              <div key={item.title} style={{
                backgroundColor: '#ffffff', borderRadius: '12px', padding: '22px 18px',
                border: '1px solid #E8E8E8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ color: '#E53935', marginBottom: '10px' }}>{item.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#1A1A1A', marginBottom: '6px', textTransform: 'uppercase' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#777777', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div style={{ backgroundColor: '#1A1A1A', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#E53935', textTransform: 'uppercase', marginBottom: '10px' }}>WHAT WE STAND FOR</div>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>Our Core Values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { num: '01', title: 'Quality First', color: '#E53935', desc: 'We never compromise on authenticity. Every part is sourced directly from manufacturers or authorised distributors.' },
              { num: '02', title: 'Customer Trust', color: '#FF9800', desc: 'Your satisfaction is our reputation. Transparent pricing and no-hidden-fees on every single order.' },
              { num: '03', title: 'Speed & Reliability', color: '#4CAF50', desc: 'Same-day dispatch and real-time tracking — because your vehicle needs to be back on the road fast.' },
            ].map(val => (
              <div key={val.num} style={{
                backgroundColor: '#242424', borderRadius: '12px', padding: '28px 24px',
                borderTop: `3px solid ${val.color}`, position: 'relative',
              }}>
                <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(255,255,255,0.05)', position: 'absolute', top: '12px', right: '20px', lineHeight: 1 }}>{val.num}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase' }}>{val.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{val.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Locations */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#E53935', textTransform: 'uppercase', marginBottom: '10px' }}>WHERE TO FIND US</div>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#1A1A1A', margin: 0, textTransform: 'uppercase' }}>Our Locations Across KSA</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { city: 'RIYADH', district: 'Al Sulay Industrial Area', phone: '+966 800 124 9900', hours: 'Sat–Thu 8am–10pm' },
            { city: 'JEDDAH', district: 'Al Khumrah Industrial Zone', phone: '+966 800 124 9900', hours: 'Sat–Thu 8am–10pm' },
            { city: 'DAMMAM', district: 'Al Jubail Highway District', phone: '+966 800 124 9900', hours: 'Sat–Thu 9am–9pm' },
          ].map(loc => (
            <div key={loc.city} style={{
              backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px 24px',
              border: '1px solid #E8E8E8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={18} color="#E53935" />
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase' }}>{loc.city}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#555555', marginBottom: '8px' }}>{loc.district}</div>
              <a href={`tel:${loc.phone.replace(/\s/g, '')}`} style={{ fontSize: '13px', color: '#E53935', fontWeight: 700, display: 'block', marginBottom: '4px', textDecoration: 'none' }}>{loc.phone}</a>
              <div style={{ fontSize: '12px', color: '#999999' }}>{loc.hours}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div style={{ backgroundColor: '#EEEEEE', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {['Official Toyota & Nissan Distributor', 'VAT Registered Business', 'Secure Online Payments', 'Cash On Delivery Available', 'Free Returns Within 7 Days'].map(badge => (
            <div key={badge} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#ffffff', borderRadius: '50px', padding: '8px 18px',
              border: '1px solid #DDDDDD', fontSize: '12px', fontWeight: 700, color: '#333333',
            }}>
              <CheckCircle size={13} color="#E53935" />
              {badge}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
