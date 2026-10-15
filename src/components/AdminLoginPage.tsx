import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
  lang?: 'en' | 'ar';
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onNavigateHome,
  lang = 'en'
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(lang === 'ar' ? 'الرجاء إدخال اسم المستخدم وكلمة المرور' : 'Please provide both username and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Validate credentials: username: demoadmin, password: demoadmin
      if (username.trim().toLowerCase() === 'demoadmin' && password === 'demoadmin') {
        sessionStorage.setItem('autoparts_admin_authenticated', 'true');
        setIsSubmitting(false);
        onSuccess();
      } else {
        setIsSubmitting(false);
        setError(
          lang === 'ar'
            ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
            : 'Invalid credentials. Please use demoadmin / demoadmin.'
        );
      }
    }, 400);
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E0E0E0'
      }}>
        {/* Top Back Link */}
        <button
          onClick={onNavigateHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#666666',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E53935')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
        >
          <ArrowLeft size={16} />
          {lang === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
        </button>

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#FFEBEE',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#E53935'
          }}>
            <ShieldCheck size={30} />
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#1A1A1A',
            margin: '0 0 6px 0',
            letterSpacing: '0.3px'
          }}>
            {lang === 'ar' ? 'بوابة إدارة النظام' : 'Admin Portal Login'}
          </h1>
          <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>
            {lang === 'ar' ? 'أدخل بيانات الاعتماد للمتابعة للوحة التحكم' : 'Sign in with your administrative credentials to continue'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#FFEBEE',
            border: '1px solid #FFCDD2',
            color: '#C62828',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '8px'
            }}>
              {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8F9FA',
              border: '1px solid #D5D5D5',
              borderRadius: '8px',
              padding: '0 12px',
              transition: 'border-color 0.2s'
            }}>
              <User size={18} color="#888888" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                autoFocus
                placeholder="demoadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1A1A1A'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '8px'
            }}>
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8F9FA',
              border: '1px solid #D5D5D5',
              borderRadius: '8px',
              padding: '0 12px',
              transition: 'border-color 0.2s'
            }}>
              <Lock size={18} color="#888888" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1A1A1A'
                }}
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: '#E53935',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s, opacity 0.2s',
              opacity: isSubmitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#C62828')}
            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#E53935')}
          >
            {isSubmitting ? (
              <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Authenticating...'}</span>
            ) : (
              <>
                <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In to Portal'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
