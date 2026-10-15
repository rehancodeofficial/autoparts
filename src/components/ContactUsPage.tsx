import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, CheckCircle } from 'lucide-react';

interface ContactUsPageProps {
  onNavigateHome: () => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({ onNavigateHome }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '44px', borderRadius: '6px',
    border: '1px solid #DDDDDD', padding: '0 14px',
    fontSize: '14px', color: '#1A1A1A', backgroundColor: '#F8F8F8',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <main style={{ flex: 1, backgroundColor: '#F5F5F5' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1E1E1E 60%, #1A0000 100%)',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '3px', color: '#E53935', textTransform: 'uppercase', marginBottom: '14px' }}>
          GET IN TOUCH
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Contact <span style={{ color: '#E53935' }}>Us</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Our expert team is ready to help you find the right part. Reach out via any channel below.
        </p>
      </div>

      {/* Contact Channels */}
      <div style={{ backgroundColor: '#E53935', padding: '0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { icon: <Phone size={22} />, label: 'TOLL FREE', value: '800 124 9900', sub: 'Sat–Thu 8am–10pm', href: 'tel:+9668001249900' },
            { icon: <MessageCircle size={22} />, label: 'WHATSAPP', value: '+966 50 123 4567', sub: 'Quick replies', href: 'https://wa.me/966501234567' },
            { icon: <Mail size={22} />, label: 'EMAIL', value: 'support@autoparts.sa', sub: 'Within 4 hours', href: 'mailto:support@autoparts.sa' },
            { icon: <Clock size={22} />, label: 'WORKING HOURS', value: 'Sat–Thu', sub: '8:00 AM – 10:00 PM', href: null },
          ].map(ch => (
            <div key={ch.label} style={{ padding: '24px 20px', borderRight: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{ch.icon}</div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '4px' }}>{ch.label}</div>
              {ch.href ? (
                <a href={ch.href} style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', textDecoration: 'none', display: 'block' }}>{ch.value}</a>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{ch.value}</div>
              )}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{ch.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form + Info */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>

          {/* Form */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', border: '1px solid #E8E8E8', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={56} color="#22c55e" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1A1A', marginBottom: '10px', textTransform: 'uppercase' }}>Message Sent!</h3>
                <p style={{ fontSize: '14px', color: '#666666', lineHeight: 1.6, marginBottom: '24px' }}>
                  Thank you for reaching out. Our team will get back to you within 4 hours.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  style={{ backgroundColor: '#E53935', color: '#ffffff', border: 'none', borderRadius: '50px', padding: '12px 28px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 24px 0', textTransform: 'uppercase' }}>Send Us a Message</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#666666', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name *</label>
                      <input required style={inputStyle} placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#666666', textTransform: 'uppercase', marginBottom: '6px' }}>Phone Number</label>
                      <input style={inputStyle} placeholder="+966 5X XXX XXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#666666', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address *</label>
                    <input required type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#666666', textTransform: 'uppercase', marginBottom: '6px' }}>Subject</label>
                    <select style={{ ...inputStyle }} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      <option value="">Select a subject</option>
                      <option>Order Inquiry</option>
                      <option>Part Availability</option>
                      <option>Return & Exchange</option>
                      <option>Technical Support</option>
                      <option>Wholesale / Business</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#666666', textTransform: 'uppercase', marginBottom: '6px' }}>Message *</label>
                    <textarea
                      required rows={5}
                      style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
                      placeholder="Describe what you need..."
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    />
                  </div>
                  <button type="submit" style={{
                    backgroundColor: '#E53935', color: '#ffffff', border: 'none',
                    borderRadius: '6px', padding: '14px', fontSize: '13px',
                    fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    letterSpacing: '0.5px',
                  }}>
                    <Send size={16} /> SEND MESSAGE
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { city: 'RIYADH HQ', district: 'Al Sulay Industrial Area, Riyadh', hours: 'Sat–Thu 8am–10pm', phone: '+966 800 124 9900' },
              { city: 'JEDDAH', district: 'Al Khumrah Industrial Zone, Jeddah', hours: 'Sat–Thu 8am–10pm', phone: '+966 800 124 9900' },
              { city: 'DAMMAM', district: 'Al Jubail Highway District, Dammam', hours: 'Sat–Thu 9am–9pm', phone: '+966 800 124 9900' },
            ].map(loc => (
              <div key={loc.city} style={{
                backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px 20px',
                border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <MapPin size={15} color="#E53935" />
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase' }}>{loc.city}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#555555', marginBottom: '4px' }}>{loc.district}</div>
                <a href={`tel:${loc.phone.replace(/\s/g, '')}`} style={{ fontSize: '12px', color: '#E53935', fontWeight: 700, display: 'block', marginBottom: '2px', textDecoration: 'none' }}>{loc.phone}</a>
                <div style={{ fontSize: '11px', color: '#999999' }}>{loc.hours}</div>
              </div>
            ))}

            {/* WhatsApp CTA */}
            <a href="https://wa.me/966501234567" target="_blank" rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366', borderRadius: '10px', padding: '20px',
                display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none',
              }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>Chat on WhatsApp</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Average reply time: under 5 mins</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};
