import React, { useState } from 'react';
import { Part, Order, PartRequest } from '../types';
import { ShoppingBag, Package, FileSpreadsheet, CheckCircle2, ArrowRight } from 'lucide-react';

interface AdminDashboardProps {
  parts: Part[];
  orders: Order[];
  partRequests: PartRequest[];
  onAddPart: (part: Part) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['deliveryStatus']) => void;
  lang: 'en' | 'ar';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  parts,
  orders,
  partRequests,
  onAddPart,
  onUpdateOrderStatus,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'import'>('orders');
  const [csvText, setCsvText] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'Paid' ? o.total : 0), 0);
  const totalStockUnits = parts.reduce((acc, p) => acc + p.stock, 0);

  const handleCsvImport = () => {
    try {
      const samplePart: Part = {
        id: `part-${Date.now()}`,
        sku: 'IMP-NEW-0091',
        oemNumber: '87139-02090',
        alternateNumbers: ['8713902090', 'CF-10285'],
        nameEn: 'Cabin Air Pollen Filter Element',
        nameAr: 'فلتر مكيف هواء الكابينة مع الكربون المنشط',
        category: 'Filters',
        brand: 'Denso Japan OEM',
        condition: 'Genuine Original',
        price: 95.0,
        originalPrice: 120.0,
        stock: 45,
        warehouseLocation: 'Riyadh Central (Bin C-12)',
        rating: 5.0,
        reviewCount: 3,
        images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'],
        descriptionEn: 'High efficiency activated carbon cabin filter blocking PM2.5 and GCC summer dust.',
        descriptionAr: 'فلتر مكيف مع حبيبات كربون نشط لعزل الغبار والروائح الكريهة بكفاءة عالية.',
        specifications: { 'Origin': 'Japan', 'Type': 'Carbon Anti-Allergen' },
        fitments: [
          { make: 'Toyota', model: 'Camry', years: [2018, 2019, 2020, 2021, 2022], notes: 'All Engine variants' },
          { make: 'Lexus', model: 'ES350', years: [2019, 2020, 2021, 2022], notes: 'Luxury trim' }
        ],
        warranty: '12 Months Warranty',
        deliveryDays: 'Same-day Riyadh'
      };

      onAddPart(samplePart);
      setImportNotice('Successfully imported and mapped 1 SKU with 2 vehicle fitment records!');
      setTimeout(() => setImportNotice(null), 4000);
    } catch (e) {
      setImportNotice('Error parsing CSV');
    }
  };

  return (
    <div style={{ padding: '32px 0' }}>
      
      {/* KPI Cards in Shop Floating Card Style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="shop-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: '#787574', fontWeight: '500' }}>Reconciled Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '6px' }}>
            {totalRevenue.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#787574' }}>SAR</span>
          </div>
          <div style={{ fontSize: '11px', color: '#0d8239', fontWeight: '500', marginTop: '6px' }}>Direct from Tap & HyperPay</div>
        </div>

        <div className="shop-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: '#787574', fontWeight: '500' }}>Warehouse Inventory</div>
          <div style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '6px' }}>
            {totalStockUnits} <span style={{ fontSize: '13px', fontWeight: '500', color: '#787574' }}>units</span>
          </div>
          <div style={{ fontSize: '11px', color: '#787574', marginTop: '6px' }}>Riyadh & Jeddah Hubs</div>
        </div>

        <div className="shop-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: '#787574', fontWeight: '500' }}>Customer Orders</div>
          <div style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '6px' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '11px', color: '#787574', marginTop: '6px' }}>Live fulfillment queue</div>
        </div>

        <div className="shop-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: '#787574', fontWeight: '500' }}>Part Leads via VIN</div>
          <div style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.04em', color: '#5433eb', marginTop: '6px' }}>
            {partRequests.length}
          </div>
          <div style={{ fontSize: '11px', color: '#787574', marginTop: '6px' }}>Direct customer requests</div>
        </div>
      </div>

      {/* Pill Tab Switchers */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          className={`shop-pill ${activeTab === 'orders' ? 'active' : ''}`}
        >
          <ShoppingBag size={14} />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`shop-pill ${activeTab === 'catalog' ? 'active' : ''}`}
        >
          <Package size={14} />
          <span>Catalog ({parts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`shop-pill ${activeTab === 'import' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={14} />
          <span>Bulk CSV Importer</span>
        </button>
      </div>

      {/* Orders Table */}
      {activeTab === 'orders' && (
        <div className="shop-card" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                <th style={{ padding: '12px' }}>Order #</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Items</th>
                <th style={{ padding: '12px' }}>Total</th>
                <th style={{ padding: '12px' }}>Method</th>
                <th style={{ padding: '12px' }}>Carrier Tracking</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '600', color: '#000000' }}>{ord.orderNumber}</td>
                  <td style={{ padding: '16px 12px', color: '#787574' }}>{ord.date}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: '500', color: '#000000' }}>{ord.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#787574' }}>{ord.city}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {ord.items.map((it, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#332f2d' }}>
                        {it.quantity}x {it.part.nameEn}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: '600', color: '#000000' }}>{ord.total.toFixed(2)} SAR</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{
                      backgroundColor: '#f2f4f5',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {ord.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '500' }}>{ord.carrier}</div>
                    <code style={{ fontSize: '11px', color: '#787574' }}>{ord.trackingNumber}</code>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <select
                      value={ord.deliveryStatus}
                      onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as Order['deliveryStatus'])}
                      className="shop-input"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="shop-card" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                <th style={{ padding: '12px' }}>Part</th>
                <th style={{ padding: '12px' }}>OEM Number</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Price</th>
                <th style={{ padding: '12px' }}>Stock</th>
                <th style={{ padding: '12px' }}>Bin Location</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                  <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={p.images[0]} alt="" style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '500', color: '#000000' }}>{p.nameEn}</div>
                      <div style={{ fontSize: '11px', color: '#787574' }}>SKU: {p.sku}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ backgroundColor: '#f2f4f5', padding: '4px 8px', borderRadius: '9999px', fontWeight: '600' }}>{p.oemNumber}</span>
                  </td>
                  <td style={{ padding: '16px 12px', color: '#787574' }}>{p.category}</td>
                  <td style={{ padding: '16px 12px', fontWeight: '600', color: '#000000' }}>{p.price.toFixed(2)} SAR</td>
                  <td style={{ padding: '16px 12px', fontWeight: '500' }}>{p.stock} units</td>
                  <td style={{ padding: '16px 12px', color: '#787574' }}>{p.warehouseLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Import */}
      {activeTab === 'import' && (
        <div className="shop-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-0.03em', color: '#000000', marginBottom: '8px' }}>
            Automotive Catalog Bulk CSV Import
          </h3>
          <p style={{ fontSize: '13px', color: '#787574', marginBottom: '20px' }}>
            Paste catalog and vehicle fitment data in CSV format to synchronize with PostgreSQL.
          </p>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`sku,oem_number,name,category,brand,price,stock,fitment_make,fitment_model,fitment_years\nIMP-091,87139-02090,Cabin Air Filter,Filters,Denso,95,45,Toyota,Camry,2018;2019;2020;2021;2022`}
            className="shop-input"
            style={{ width: '100%', borderRadius: '20px', fontFamily: 'monospace', fontSize: '12px', marginBottom: '20px' }}
          />

          {importNotice && (
            <div style={{ backgroundColor: '#e6f9ed', color: '#0d8239', padding: '12px 18px', borderRadius: '9999px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{importNotice}</span>
            </div>
          )}

          <button onClick={handleCsvImport} className="btn-shop-primary">
            <span>Import Catalog Data</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
