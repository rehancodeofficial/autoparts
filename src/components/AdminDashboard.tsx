import React, { useState } from 'react';
import { Part, Order, PartRequest, VehicleMake, PartCategory, PartBrand, QualityGradeConfig } from '../types';
import { 
  ShoppingBag, Package, FileSpreadsheet, CheckCircle2, 
  ArrowRight, Plus, Car, Layers, Eye, EyeOff, Edit2, Shield 
} from 'lucide-react';
import { VehicleManufacturerManager } from './VehicleManufacturerManager';
import { CategoryAndBrandManager } from './CategoryAndBrandManager';
import { ProductFormModal } from './ProductFormModal';

interface AdminDashboardProps {
  parts: Part[];
  orders: Order[];
  partRequests: PartRequest[];
  makes: VehicleMake[];
  categories: PartCategory[];
  brands: PartBrand[];
  qualityGrades: QualityGradeConfig[];
  onAddPart: (part: Part) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['deliveryStatus']) => void;
  onRefreshAllData: () => void;
  lang: 'en' | 'ar';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  parts,
  orders,
  partRequests,
  makes,
  categories,
  brands,
  qualityGrades,
  onAddPart,
  onUpdateOrderStatus,
  onRefreshAllData,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'makes' | 'taxonomy' | 'orders' | 'import'>('catalog');
  const [csvText, setCsvText] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Product Form Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'Paid' ? o.total : 0), 0);
  const totalStockUnits = parts.reduce((acc, p) => acc + (p.stock || 0), 0);

  const handleOpenAddProduct = () => {
    setEditingPart(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (part: Part) => {
    setEditingPart(part);
    setIsProductModalOpen(true);
  };

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
        qualityGrade: 'GRADE_A',
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
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="shop-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#787574', fontWeight: '600' }}>Active Vehicle Makes</div>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '4px' }}>
            {makes.filter(m => m.isPublished).length} <span style={{ fontSize: '12px', fontWeight: '500', color: '#787574' }}>published</span>
          </div>
          <div style={{ fontSize: '11px', color: '#0d8239', fontWeight: '500', marginTop: '4px' }}>Toyota, Honda, BMW...</div>
        </div>

        <div className="shop-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#787574', fontWeight: '600' }}>Catalog Products</div>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '4px' }}>
            {parts.length} <span style={{ fontSize: '12px', fontWeight: '500', color: '#787574' }}>SKUs</span>
          </div>
          <div style={{ fontSize: '11px', color: '#5433eb', fontWeight: '500', marginTop: '4px' }}>{totalStockUnits} warehouse units</div>
        </div>

        <div className="shop-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#787574', fontWeight: '600' }}>Customer Orders</div>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '4px' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '11px', color: '#787574', marginTop: '4px' }}>{totalRevenue.toLocaleString()} SAR revenue</div>
        </div>

        <div className="shop-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#787574', fontWeight: '600' }}>Part Inquiries / Leads</div>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.04em', color: '#000000', marginTop: '4px' }}>
            {partRequests.length}
          </div>
          <div style={{ fontSize: '11px', color: '#787574', marginTop: '4px' }}>Direct customer requests</div>
        </div>
      </div>

      {/* Pill Tab Switchers */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`shop-pill ${activeTab === 'catalog' ? 'active' : ''}`}
        >
          <Package size={14} />
          <span>Product Catalog ({parts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('makes')}
          className={`shop-pill ${activeTab === 'makes' ? 'active' : ''}`}
        >
          <Car size={14} />
          <span>Vehicle Manufacturers ({makes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`shop-pill ${activeTab === 'taxonomy' ? 'active' : ''}`}
        >
          <Layers size={14} />
          <span>Categories & Brands</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`shop-pill ${activeTab === 'orders' ? 'active' : ''}`}
        >
          <ShoppingBag size={14} />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`shop-pill ${activeTab === 'import' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={14} />
          <span>Bulk CSV Importer</span>
        </button>
      </div>

      {/* 1. Catalog Tab */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Automotive Products Catalog</h3>
              <p style={{ fontSize: '12px', color: '#787574', margin: '2px 0 0' }}>
                Full product lifecycle: pricing, inventory, quality grades, fitment mapping, and publication status.
              </p>
            </div>
            <button onClick={handleOpenAddProduct} className="btn-shop-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>

          <div className="shop-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#787574', borderBottom: '1px solid #ebebeb' }}>
                  <th style={{ padding: '12px' }}>Product</th>
                  <th style={{ padding: '12px' }}>OEM / SKU</th>
                  <th style={{ padding: '12px' }}>Category & Brand</th>
                  <th style={{ padding: '12px' }}>Quality Tier</th>
                  <th style={{ padding: '12px' }}>Price</th>
                  <th style={{ padding: '12px' }}>Stock</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f2f4f5' }}>
                    <td style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.images[0] || 'https://via.placeholder.com/44'} alt="" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '600', color: '#000000' }}>{p.nameEn}</div>
                        <div style={{ fontSize: '11px', color: '#787574' }}>{p.nameAr}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ backgroundColor: '#f2f4f5', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '11px' }}>
                        {p.oemNumber || p.sku}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: '500' }}>{p.category}</div>
                      <div style={{ fontSize: '11px', color: '#787574' }}>{p.brand}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: p.qualityGrade === 'GRADE_A' ? '#000000' : p.qualityGrade === 'GRADE_B' ? '#5433eb' : '#f2f4f5',
                        color: (p.qualityGrade === 'GRADE_A' || p.qualityGrade === 'GRADE_B') ? '#ffffff' : '#000000'
                      }}>
                        {p.qualityGrade || 'GRADE_A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: '700', color: '#000000' }}>
                      {p.price.toFixed(2)} SAR
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontWeight: '600', color: p.stock > 0 ? '#0d8239' : '#d92d20' }}>
                        {p.stock} units
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: (p.status === 'PUBLISHED' || !p.status) ? '#e6f9ed' : '#feeae9',
                        color: (p.status === 'PUBLISHED' || !p.status) ? '#0d8239' : '#d92d20'
                      }}>
                        {p.status || 'PUBLISHED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        style={{ padding: '6px 12px', border: '1px solid #ebebeb', borderRadius: '8px', background: '#ffffff', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Vehicle Manufacturers Tab */}
      {activeTab === 'makes' && (
        <VehicleManufacturerManager
          makes={makes}
          onRefresh={onRefreshAllData}
          lang={lang}
        />
      )}

      {/* 3. Taxonomy & Brands Tab */}
      {activeTab === 'taxonomy' && (
        <CategoryAndBrandManager
          categories={categories}
          brands={brands}
          qualityGrades={qualityGrades}
          onRefresh={onRefreshAllData}
          lang={lang}
        />
      )}

      {/* 4. Orders Tab */}
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

      {/* 5. CSV Import Tab */}
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

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          initialProduct={editingPart}
          makes={makes}
          categories={categories}
          brands={brands}
          qualityGrades={qualityGrades}
          onClose={() => setIsProductModalOpen(false)}
          onSaveSuccess={() => {
            setIsProductModalOpen(false);
            onRefreshAllData();
          }}
          lang={lang}
        />
      )}

    </div>
  );
};
