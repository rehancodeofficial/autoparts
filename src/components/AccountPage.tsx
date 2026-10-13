import React, { useState, useEffect } from 'react';
import { User, Shield, Package, MapPin, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountPageProps {
  lang: 'en' | 'ar';
  onLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ lang, onLogout }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, addrsRes] = await Promise.all([
        fetch('/api/account/orders', { credentials: 'include' }).then(r => r.ok ? r.json() : { orders: [] }),
        fetch('/api/account/addresses', { credentials: 'include' }).then(r => r.ok ? r.json() : { addresses: [] })
      ]);
      setOrders(ordersRes.orders || []);
      setAddresses(addrsRes.addresses || []);
    } catch {}
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div style={{
      maxWidth: '880px',
      margin: '40px auto',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      padding: '36px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
      border: '1px solid var(--color-faint-border, #f2f4f5)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '24px',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '700'
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', margin: 0 }}>
              {user.name}
            </h1>
            <p style={{ fontSize: '13px', color: '#787574', margin: '4px 0 0' }}>
              {user.email} • {user.role === 'SUPER_ADMIN' ? (lang === 'ar' ? 'مدير النظام' : 'Super Admin') : (lang === 'ar' ? 'عميل موثق' : 'Verified Customer')}
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            await logout();
            onLogout();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fff1f0',
            color: '#cf1322',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
          <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { id: 'profile', label: lang === 'ar' ? 'الملف الشخصي' : 'Profile', icon: <User size={16} /> },
          { id: 'orders', label: lang === 'ar' ? `طلباتي (${orders.length})` : `My Orders (${orders.length})`, icon: <Package size={16} /> },
          { id: 'addresses', label: lang === 'ar' ? `العناوين (${addresses.length})` : `Saved Addresses (${addresses.length})`, icon: <MapPin size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#000000' : '#f2f4f5',
              color: activeTab === tab.id ? '#ffffff' : '#595959'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>
              {lang === 'ar' ? 'الاسم' : 'Full Name'}
            </span>
            <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', color: '#000000' }}>{user.name}</p>
          </div>
          <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </span>
            <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', color: '#000000' }}>{user.email}</p>
          </div>
          <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>
              {lang === 'ar' ? 'رقم الجوال' : 'Phone'}
            </span>
            <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', color: '#000000' }}>{user.phone || (lang === 'ar' ? 'لم يسجل' : 'Not set')}</p>
          </div>
          <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>
              {lang === 'ar' ? 'نوع الحساب' : 'Role'}
            </span>
            <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px', color: '#000000' }}>{user.role}</p>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>{lang === 'ar' ? 'لا توجد طلبات سابقة حتى الآن' : 'No previous orders found.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map(order => (
                <div key={order.id} style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#000000' }}>{order.orderNumber}</span>
                      <span style={{
                        backgroundColor: '#e6f7ff',
                        color: '#0958d9',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#8c8c8c', margin: 0 }}>
                      {order.city} • {order.paymentMethod?.toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#000000' }}>
                      {(order.totalHalalas / 100).toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div>
          {addresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              <MapPin size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>{lang === 'ar' ? 'لم تقم بحفظ أي عنوان بعد' : 'No saved addresses found.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {addresses.map(addr => (
                <div key={addr.id} style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '16px',
                  padding: '16px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span style={{ fontSize: '10px', backgroundColor: '#5433eb', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#595959', margin: '4px 0' }}>{addr.phone}</p>
                  <p style={{ fontSize: '12px', color: '#595959', margin: '4px 0' }}>{addr.city}, {addr.district}, {addr.street}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
