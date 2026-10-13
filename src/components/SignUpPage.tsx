import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CartItem } from '../types';

interface SignUpPageProps {
  onNavigateToLogin: () => void;
  onSuccess: () => void;
  lang: 'en' | 'ar';
  guestCart?: CartItem[];
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateToLogin,
  onSuccess,
  lang,
  guestCart = []
}) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(lang === 'ar' ? 'الرجاء إدخال الاسم الكامل' : 'Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(lang === 'ar' ? 'الرجاء إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError(lang === 'ar' ? 'يجب أن لا تقل كلمة المرور عن 8 أحرف' : 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError(lang === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'You must accept the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name,
      email,
      phone: phone || undefined,
      password,
      confirmPassword,
      guestCart
    });
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || (lang === 'ar' ? 'تعذر إنشاء الحساب' : 'Failed to register account.'));
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
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
          <UserPlus size={22} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginBottom: '8px' }}>
          {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account'}
        </h1>
        <p style={{ fontSize: '13px', color: '#787574' }}>
          {lang === 'ar' ? 'انضم إلى AutoPart KSA للوصول إلى قطع غيار أصلية ومتابعة طلباتك' : 'Join AutoPart KSA for authentic spare parts & order tracking'}
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
            {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
          </label>
          <input
            id="signup-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === 'ar' ? 'سلطان العتيبي' : 'e.g. Sultan Al-Otaibi'}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: '1px solid #d9d9d9',
              padding: '0 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
            {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
          </label>
          <input
            id="signup-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sultan@example.sa"
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: '1px solid #d9d9d9',
              padding: '0 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
            {lang === 'ar' ? 'رقم الجوال (اختياري)' : 'Mobile Phone (Optional)'}
          </label>
          <input
            id="signup-phone-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966 50 123 4567"
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: '1px solid #d9d9d9',
              padding: '0 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
              {lang === 'ar' ? 'كلمة المرور' : 'Password'} *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password-input"
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
                  padding: '0 36px 0 12px',
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
                  top: '14px',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8c8c8c'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
              {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm'} *
            </label>
            <input
              id="signup-confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #d9d9d9',
                padding: '0 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#595959', marginTop: '4px' }}>
          <input
            id="signup-terms-checkbox"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ accentColor: '#5433eb', marginTop: '2px', cursor: 'pointer' }}
          />
          <span>
            {lang === 'ar' 
              ? 'أوافق على الشروط والأحكام وسياسة الخصوصية الخاصة بـ AutoPart KSA'
              : 'I agree to the AutoPart KSA Terms of Service and Privacy Policy.'}
          </span>
        </label>

        <button
          id="signup-submit-button"
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
          <span>{isSubmitting ? (lang === 'ar' ? 'جارٍ الإنشاء...' : 'Creating Account...') : (lang === 'ar' ? 'إنشاء حساب' : 'Create Account')}</span>
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
        <span>{lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'} </span>
        <button
          id="navigate-to-login-btn"
          onClick={onNavigateToLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5433eb',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};
