import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CartItem } from '../types';

interface LoginPageProps {
  onNavigateToSignUp: () => void;
  onSuccess: () => void;
  lang: 'en' | 'ar';
  guestCart?: CartItem[];
  intendedDestination?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignUp,
  onSuccess,
  lang,
  guestCart = [],
  intendedDestination
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password, guestCart);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || (lang === 'ar' ? 'بيانات الاعتماد غير صحيحة' : 'Invalid email or password.'));
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '40px auto',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      padding: '36px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
      border: '1px solid var(--color-faint-border, #f2f4f5)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '16px',
          backgroundColor: '#f2f4f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#5433eb'
        }}>
          <Lock size={22} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginBottom: '8px' }}>
          {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In to AutoPart'}
        </h1>
        <p style={{ fontSize: '13px', color: '#787574' }}>
          {intendedDestination === 'checkout' 
            ? (lang === 'ar' ? 'يرجى تسجيل الدخول لإتمام عملية الشراء وحفظ طلبك بأمان' : 'Please sign in to proceed to secure checkout.')
            : (lang === 'ar' ? 'أدخل بريدك الإلكتروني للوصول إلى حسابك وطلباتك' : 'Enter your email to access your account and orders.')}
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fff1f0',
          border: '1px solid #ffccc7',
          padding: '12px 14px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#cf1322',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {forgotSent && (
        <div style={{
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          padding: '12px 14px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#389e0d',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>
            {lang === 'ar' 
              ? 'إذا كان هذا الحساب مسجلاً، فقد تم إرسال رابط إعادة التعيين بأمان.'
              : 'If an account exists with this email, password reset instructions have been dispatched.'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
            {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.sa"
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #d9d9d9',
                padding: '0 14px',
                paddingLeft: lang === 'en' ? '40px' : '14px',
                paddingRight: lang === 'ar' ? '40px' : '14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Mail size={16} style={{
              position: 'absolute',
              top: '15px',
              left: lang === 'en' ? '14px' : 'auto',
              right: lang === 'ar' ? '14px' : 'auto',
              color: '#8c8c8c'
            }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
            {lang === 'ar' ? 'كلمة المرور' : 'Password'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #d9d9d9',
                padding: '0 40px 0 14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                top: '13px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#8c8c8c'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#595959' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: '#5433eb', cursor: 'pointer' }}
            />
            {lang === 'ar' ? 'تذكرني' : 'Remember me'}
          </label>

          <button
            type="button"
            onClick={() => setForgotSent(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5433eb',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </button>
        </div>

        <button
          id="login-submit-button"
          type="submit"
          disabled={isSubmitting}
          style={{
            height: '48px',
            backgroundColor: isSubmitting ? '#acb0aa' : '#000000',
            color: '#ffffff',
            borderRadius: '14px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            marginTop: '8px'
          }}
        >
          <span>{isSubmitting ? (lang === 'ar' ? 'جارٍ التحقق...' : 'Signing In...') : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}</span>
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>

      <div style={{
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid #f0f0f0',
        textAlign: 'center',
        fontSize: '13px',
        color: '#595959'
      }}>
        <span>{lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"} </span>
        <button
          id="navigate-to-signup-btn"
          onClick={onNavigateToSignUp}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5433eb',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up / Create Account'}
        </button>
      </div>
    </div>
  );
};
