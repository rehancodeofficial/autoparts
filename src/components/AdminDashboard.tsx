import React, { useState, useMemo } from 'react';
import { Part, Order, PartRequest, VehicleMake, PartCategory, PartBrand, QualityGradeConfig } from '../types';
import { 
  Package, ShoppingBag, Flame, Sparkles, TrendingUp, DollarSign,
  Plus, Edit2, Trash2, Search, Filter, CheckCircle2, AlertCircle,
  Tag, Percent, Star, ArrowUpRight, ArrowDownRight, Layers, Car,
  Box, Eye, RefreshCw, X, ShieldCheck, LogOut, ChevronRight, LayoutDashboard,
  Sliders, ArrowLeft
} from 'lucide-react';
import { VehicleManufacturerManager } from './VehicleManufacturerManager';
import { CategoryAndBrandManager } from './CategoryAndBrandManager';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminDiscountsPanel } from './AdminDiscountsPanel';
import { apiPatch, apiPut, apiDelete, ApiError } from '../utils/api';

interface AdminDashboardProps {
  parts: Part[];
  orders: Order[];
  partRequests: PartRequest[];
  makes: VehicleMake[];
  categories: PartCategory[];
  brands: PartBrand[];
  qualityGrades: QualityGradeConfig[];
  onAddPart: (part: Part) => void;
  onUpdatePart?: (part: Part) => void;
  onDeletePart?: (partId: string) => void;
  onRefreshAllData: () => void;
  onLogout?: () => void;
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
  onUpdatePart,
  onDeletePart,
  onRefreshAllData,
  onLogout,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'deals' | 'featured' | 'orders' | 'discounts' | 'makes' | 'taxonomy'>('overview');
  
  // Search & Filters in Inventory Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal State for Quick Add / Edit Product
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    sku: '',
    oemNumber: '',
    category: 'Braking Systems',
    categorySlug: 'brakes',
    brand: 'Genuine OEM',
    price: 299,
    originalPrice: 350,
    salePrice: 0,
    hasDiscount: false,
    stock: 20,
    qualityGrade: 'GRADE_A',
    condition: 'Genuine Original',
    warehouseLocation: 'Riyadh Central Distribution Hub',
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80',
    descriptionEn: '',
    isFeatured: false,
    isDeal: false,
    dealBadge: '15% OFF',
    dealEndDate: ''
  });

  // Surfaces a save that the server rejected. Stock, deal and featured edits
  // used to update React state only, so a change that never reached the
  // database still appeared to have worked until the page was reloaded.
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Persists a product change, then reloads from the database. */
  const persistProduct = async (
    part: Part,
    changes: Record<string, any>,
    describe: string
  ): Promise<boolean> => {
    setSaveError(null);
    try {
      await apiPut(`/api/admin/products/${part.id}`, {
        sku: part.sku,
        slug: part.slug,
        nameEn: part.nameEn,
        nameAr: part.nameAr,
        categoryId: part.categoryId,
        brandId: part.brandId,
        sellingPrice: part.originalPrice ?? part.price,
        stockQuantity: part.stock,
        status: part.status || 'PUBLISHED',
        ...changes,
      });
      onRefreshAllData();
      return true;
    } catch (err) {
      setSaveError(`${describe} could not be saved: ${(err as ApiError).message}`);
      return false;
    }
  };

  // Modal State for Quick Stock Adjust
  const [stockAdjustModal, setStockAdjustModal] = useState<{ isOpen: boolean; part: Part | null; quantity: number }>({
    isOpen: false,
    part: null,
    quantity: 0
  });

  // Modal State for Quick Deal / Discount Adjust
  const [dealModal, setDealModal] = useState<{
    isOpen: boolean;
    part: Part | null;
    salePrice: number;
    originalPrice: number;
    discountPercent: number;
    dealBadge: string;
    isFeatured: boolean;
  }>({
    isOpen: false,
    part: null,
    salePrice: 0,
    originalPrice: 0,
    discountPercent: 10,
    dealBadge: 'SPECIAL OFFER',
    isFeatured: false
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const totalParts = parts.length;
    const totalStock = parts.reduce((acc, p) => acc + (p.stock || 0), 0);
    const lowStockCount = parts.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockCount = parts.filter(p => p.stock === 0).length;
    const featuredCount = parts.filter(p => (p as any).isFeatured).length;
    const dealsCount = parts.filter(p => (p as any).isDeal || ((p.originalPrice || 0) > p.price)).length;
    const totalInventoryValue = parts.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
    const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'Paid' ? o.total : 0), 0);

    return {
      totalParts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      featuredCount,
      dealsCount,
      totalInventoryValue,
      totalRevenue
    };
  }, [parts, orders]);

  // Filtered Parts for Inventory Table
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = 
        !searchQuery ||
        part.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.oemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = filterCategory === 'all' || part.categorySlug === filterCategory || part.category === filterCategory;

      let matchesStock = true;
      if (filterStockStatus === 'in_stock') matchesStock = part.stock > 5;
      else if (filterStockStatus === 'low_stock') matchesStock = part.stock > 0 && part.stock <= 5;
      else if (filterStockStatus === 'out_of_stock') matchesStock = part.stock === 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [parts, searchQuery, filterCategory, filterStockStatus]);

  // Featured Products
  const featuredParts = useMemo(() => {
    return parts.filter(p => (p as any).isFeatured);
  }, [parts]);

  // Active Deals
  const dealParts = useMemo(() => {
    return parts.filter(p => (p as any).isDeal || ((p.originalPrice || 0) > p.price));
  }, [parts]);

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingPart(null);
    setFormData({
      nameEn: '',
      nameAr: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      oemNumber: '',
      category: 'Braking Systems',
      categorySlug: 'brakes',
      brand: 'Genuine OEM',
      price: 199,
      originalPrice: 250,
      salePrice: 0,
      hasDiscount: false,
      stock: 25,
      qualityGrade: 'GRADE_A',
      condition: 'Genuine Original',
      warehouseLocation: 'Riyadh Central Distribution Hub',
      imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80',
      descriptionEn: '',
      isFeatured: false,
      isDeal: false,
      dealBadge: '15% OFF',
      dealEndDate: ''
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      nameEn: part.nameEn || '',
      nameAr: part.nameAr || '',
      sku: part.sku || '',
      oemNumber: part.oemNumber || '',
      category: part.category || 'Braking Systems',
      categorySlug: part.categorySlug || 'brakes',
      brand: part.brand || 'Genuine OEM',
      price: part.price || 0,
      originalPrice: part.originalPrice || part.price,
      salePrice: (part as any).salePrice || 0,
      hasDiscount: !!((part.originalPrice && part.originalPrice > part.price) || (part as any).isDeal),
      stock: part.stock || 0,
      qualityGrade: part.qualityGrade || 'GRADE_A',
      condition: part.condition || 'Genuine Original',
      warehouseLocation: part.warehouseLocation || 'Riyadh Central Hub',
      imageUrl: part.images?.[0] || 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80',
      descriptionEn: part.descriptionEn || '',
      isFeatured: !!(part as any).isFeatured,
      isDeal: !!(part as any).isDeal,
      dealBadge: (part as any).dealBadge || 'SPECIAL OFFER',
      dealEndDate: (part as any).dealEndDate || ''
    });
    setIsAddEditModalOpen(true);
  };

  // Save Product (Add or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn.trim() || !formData.sku.trim()) {
      alert('Please enter a product name and SKU');
      return;
    }

    const price = Number(formData.price) || 0;
    const origPrice = formData.hasDiscount && Number(formData.originalPrice) > price ? Number(formData.originalPrice) : (price * 1.2);

    const savedPart: Part = {
      id: editingPart ? editingPart.id : `part-${Date.now()}`,
      sku: formData.sku.trim(),
      oemNumber: formData.oemNumber.trim() || formData.sku.trim(),
      alternateNumbers: editingPart?.alternateNumbers || [],
      nameEn: formData.nameEn.trim(),
      nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
      category: formData.category,
      categorySlug: formData.categorySlug,
      brand: formData.brand,
      condition: formData.condition,
      qualityGrade: formData.qualityGrade,
      price: price,
      originalPrice: formData.hasDiscount ? origPrice : undefined,
      stock: Number(formData.stock) || 0,
      warehouseLocation: formData.warehouseLocation,
      rating: editingPart?.rating || 5.0,
      reviewCount: editingPart?.reviewCount || 1,
      images: [formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80'],
      descriptionEn: formData.descriptionEn.trim() || `${formData.nameEn} genuine automotive component.`,
      descriptionAr: formData.nameAr ? `${formData.nameAr} قطعة غيار أصلية معتمدة.` : '',
      specifications: editingPart?.specifications || { 'Origin': 'Japan', 'Warranty': '12 Months' },
      fitments: editingPart?.fitments || [
        { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025] }
      ],
      warranty: '12 Months Official Warranty',
      deliveryDays: 'Same-day Riyadh, 24-48h KSA',
      ...(formData as any)
    };

    if (editingPart && onUpdatePart) {
      onUpdatePart(savedPart);
    } else {
      onAddPart(savedPart);
    }

    setIsAddEditModalOpen(false);
  };

  // Toggle Featured status directly
  const handleToggleFeatured = async (part: Part) => {
    await persistProduct(
      part,
      { isFeatured: !part.isFeatured },
      `The featured flag for "${part.nameEn}"`
    );
  };

  // Quick Stock Update submit. Goes through the inventory endpoint so the
  // change is recorded as an InventoryMovement with the acting admin.
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const part = stockAdjustModal.part;
    if (!part) return;

    const newStock = Math.floor(Number(stockAdjustModal.quantity));
    if (!Number.isFinite(newStock) || newStock < 0) {
      setSaveError('Stock must be a whole number of 0 or more.');
      return;
    }

    setSaveError(null);
    try {
      await apiPatch(`/api/admin/products/${part.id}/stock`, {
        stockQuantity: newStock,
        note: `Adjusted from the inventory table (was ${part.stock})`,
      });
      setStockAdjustModal({ isOpen: false, part: null, quantity: 0 });
      onRefreshAllData();
    } catch (err) {
      setSaveError(`Stock for "${part.nameEn}" could not be saved: ${(err as ApiError).message}`);
    }
  };

  // Quick Deal/Discount Update submit
  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealModal.part) return;
    
    const originalPrice = Number(dealModal.originalPrice) || dealModal.part.price;
    const salePrice = Number(dealModal.salePrice) || dealModal.part.price;
    const isDealActive = salePrice < originalPrice;

    if (salePrice < 0 || originalPrice < 0) {
      setSaveError('Prices cannot be negative.');
      return;
    }

    // `sellingPrice` is the list price and `salePrice` the promotional one, so
    // the storefront and the checkout both derive the same figure.
    const ok = await persistProduct(
      dealModal.part,
      {
        sellingPrice: originalPrice,
        salePrice: isDealActive ? salePrice : null,
        isFeatured: dealModal.isFeatured,
      },
      `The deal for "${dealModal.part.nameEn}"`
    );

    if (ok) {
      setDealModal({ isOpen: false, part: null, salePrice: 0, originalPrice: 0, discountPercent: 0, dealBadge: '', isFeatured: false });
    }
  };

  // Navigation Items for Side Panel
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: <LayoutDashboard size={18} />, badge: null },
    { id: 'inventory', label: 'Inventory & Stock', icon: <Package size={18} />, badge: parts.length },
    { id: 'deals', label: 'Deals & Clearance', icon: <Flame size={18} />, badge: stats.dealsCount },
    { id: 'featured', label: 'Featured Showcase', icon: <Sparkles size={18} />, badge: stats.featuredCount },
    { id: 'orders', label: 'Orders & Fulfillment', icon: <ShoppingBag size={18} />, badge: orders.length },
    { id: 'discounts', label: 'Discount Codes', icon: <Percent size={18} />, badge: null },
    { id: 'makes', label: 'Vehicle Makes', icon: <Car size={18} />, badge: makes.length },
    { id: 'taxonomy', label: 'Categories & Brands', icon: <Layers size={18} />, badge: null }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 120px)',
      backgroundColor: '#F3F4F6',
      width: '100%'
    }}>
      
      {/* =========================================================================
          LEFT SIDE PANEL NAVIGATION
          ========================================================================= */}
      <aside style={{
        width: '270px',
        backgroundColor: '#1E1E1E',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        borderRight: '1px solid #2F2F2F',
        boxShadow: '2px 0 12px rgba(0,0,0,0.08)'
      }}>
        {/* Brand & Portal Header */}
        <div>
          <div style={{
            padding: '24px 20px',
            borderBottom: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#E53935',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(229,57,53,0.4)',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px', color: '#ffffff' }}>
                ADMIN CONSOLE
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                Operations & Catalog Hub
              </div>
            </div>
          </div>

          {/* Quick Create Action in Side Panel */}
          <div style={{ padding: '16px 16px 8px 16px' }}>
            <button
              onClick={handleOpenAdd}
              style={{
                width: '100%',
                height: '40px',
                backgroundColor: '#E53935',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s, transform 0.1s',
                boxShadow: '0 4px 14px rgba(229, 57, 53, 0.3)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C62828')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E53935')}
            >
              <Plus size={16} />
              <span>Add Product SKU</span>
            </button>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 10px 4px 10px' }}>
              Main Navigation
            </div>

            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? 'rgba(229, 57, 53, 0.15)' : 'transparent',
                    color: isActive ? '#FF6B6B' : '#D1D5DB',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: isActive ? '#E53935' : '#9CA3AF' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span style={{
                      backgroundColor: isActive ? '#E53935' : '#374151',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '10px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Session & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #2A2A2A' }}>
          <div style={{
            backgroundColor: '#141414',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px',
            border: '1px solid #2C2C2C'
          }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Active Administrator</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>demoadmin</div>
            <div style={{ fontSize: '10px', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              Session Verified
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
          >
            <LogOut size={14} />
            <span>Exit Admin Portal</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN CONTENT AREA
          ========================================================================= */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        
        {/* Top Header Row in Main Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '0.3px' }}>
              {activeTab === 'overview' && 'Portal Analytics & Overview'}
              {activeTab === 'inventory' && 'Inventory Catalog & Stock Replenishment'}
              {activeTab === 'deals' && 'Flash Deals, Discounts & Clearance'}
              {activeTab === 'featured' && 'Featured Section Promotion Manager'}
              {activeTab === 'orders' && 'Customer Orders & Shipments'}
              {activeTab === 'discounts' && 'Discount Codes & Promotions'}
              {activeTab === 'makes' && 'Vehicle Manufacturers Management'}
              {activeTab === 'taxonomy' && 'Product Categories & Brand Directory'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
              Real-time synchronization with storefront and distribution center
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onRefreshAllData}
              style={{
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={handleOpenAdd}
              style={{
                backgroundColor: '#E53935',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(229,57,53,0.3)'
              }}
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {/* Total SKUs */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total SKUs</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2937' }}>
                <Package size={17} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{stats.totalParts}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={13} /> Active Catalog SKUs
            </div>
          </div>

          {/* Warehouse Stock Units */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Stock Units</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <Box size={17} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{stats.totalStock.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
              {stats.lowStockCount > 0 ? (
                <span style={{ color: '#D97706', fontWeight: 700 }}>Notice: {stats.lowStockCount} items low stock</span>
              ) : (
                <span style={{ color: '#059669', fontWeight: 600 }}>All items well stocked</span>
              )}
            </div>
          </div>

          {/* Active Deals */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Deals</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                <Flame size={17} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#E53935', lineHeight: 1 }}>{stats.dealsCount}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
              Discounted in Deals section
            </div>
          </div>

          {/* Featured Slots */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Featured Items</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Sparkles size={17} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{stats.featuredCount}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
              Promoted on Homepage
            </div>
          </div>

          {/* Retail Inventory Value */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Inventory Value</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <DollarSign size={17} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
              {stats.totalInventoryValue.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>SAR</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
              Total retail valuation
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {/* A save the server rejected is shown here instead of silently
            leaving the table looking up to date. */}
        {saveError && (
          <div style={{
            marginBottom: '18px',
            padding: '13px 16px',
            borderRadius: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span>
              <AlertCircle size={15} style={{ verticalAlign: '-3px', marginRight: '7px' }} />
              {saveError}
            </span>
            <button
              onClick={() => setSaveError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C' }}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Quick Actions Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 16px 0' }}>
                  Management Shortcuts
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <button
                    onClick={handleOpenAdd}
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E53935', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                      <Plus size={18} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#991B1B' }}>Add Inventory Item</div>
                    <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '2px' }}>Create new product SKU</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('deals')}
                    style={{
                      backgroundColor: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EA580C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                      <Percent size={18} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#9A3412' }}>Create Flash Deal</div>
                    <div style={{ fontSize: '11px', color: '#C2410C', marginTop: '2px' }}>Apply discount percentage</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('featured')}
                    style={{
                      backgroundColor: '#FEFCE8',
                      border: '1px solid #FEF08A',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#CA8A04', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                      <Star size={18} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#854D0E' }}>Manage Featured</div>
                    <div style={{ fontSize: '11px', color: '#A16207', marginTop: '2px' }}>Homepage showcase slots</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                      <Box size={18} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#166534' }}>Stock Replenish</div>
                    <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>Update warehouse stock</div>
                  </button>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#E53935" />
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                      Stock Level Alerts ({parts.filter(p => p.stock <= 5).length})
                    </h2>
                  </div>
                  <button
                    onClick={() => { setActiveTab('inventory'); setFilterStockStatus('low_stock'); }}
                    style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All Warnings
                  </button>
                </div>

                {parts.filter(p => p.stock <= 5).length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                    <CheckCircle2 size={30} color="#10B981" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700, color: '#111827' }}>All items in inventory are sufficiently stocked.</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>No low stock alerts detected.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {parts.filter(p => p.stock <= 5).map(part => (
                      <div
                        key={part.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={part.images?.[0] || 'https://via.placeholder.com/40'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{part.nameEn}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>SKU: {part.sku} • {part.warehouseLocation}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            backgroundColor: part.stock === 0 ? '#FEE2E2' : '#FEF3C7',
                            color: part.stock === 0 ? '#B91C1C' : '#B45309',
                            fontWeight: 800,
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            {part.stock === 0 ? 'Out of Stock' : `${part.stock} left`}
                          </span>
                          <button
                            onClick={() => setStockAdjustModal({ isOpen: true, part, quantity: part.stock })}
                            style={{
                              backgroundColor: '#E53935',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Add Stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Promotion Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Active Deals Box */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} color="#E53935" />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#111827' }}>Active Store Deals</h3>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#E53935' }}>{dealParts.length} active</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 14px 0' }}>
                  Special discounted prices shown on the store front.
                </p>
                {dealParts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '12px', color: '#9CA3AF' }}>
                    No active deals right now.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dealParts.slice(0, 4).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{p.nameEn}</div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#E53935' }}>{p.price} SAR</div>
                          {p.originalPrice && (
                            <div style={{ fontSize: '10px', color: '#9CA3AF', textDecoration: 'line-through' }}>{p.originalPrice} SAR</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Showcase Box */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#D97706" />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#111827' }}>Featured Showcase</h3>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#D97706' }}>{featuredParts.length} items</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 14px 0' }}>
                  Prominently featured products in the store's primary showcase.
                </p>
                {featuredParts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '12px', color: '#9CA3AF' }}>
                    Featured section is currently empty.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {featuredParts.slice(0, 4).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{p.nameEn}</div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                          Featured
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Catalog Products & Warehouse Inventory
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Manage SKU specifications, quantities, prices, and promotion statuses
                </p>
              </div>
              
              <button
                onClick={handleOpenAdd}
                style={{
                  backgroundColor: '#E53935',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#F9FAFB',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {/* Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '0 12px',
                flex: 1,
                minWidth: '220px',
                height: '38px'
              }}>
                <Search size={16} color="#9CA3AF" style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Search by part name, SKU, OEM #, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                <option value="brakes">Braking Systems</option>
                <option value="engine-parts">Engine & Exhaust</option>
                <option value="filters">Filters & Intake</option>
                <option value="fluids">Oils & Fluids</option>
                <option value="wheels">Alloy Wheels & Tires</option>
                <option value="ignition">Ignition & Electrical</option>
              </select>

              {/* Stock Filter */}
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as any)}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt; 5)</option>
                <option value="low_stock">Low Stock (1-5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Products Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px' }}>Product & OEM</th>
                    <th style={{ padding: '12px 14px' }}>Category & Brand</th>
                    <th style={{ padding: '12px 14px' }}>Price (SAR)</th>
                    <th style={{ padding: '12px 14px' }}>Stock Units</th>
                    <th style={{ padding: '12px 14px' }}>Promotions</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        <Package size={36} style={{ margin: '0 auto 8px auto', display: 'block', color: '#D1D5DB' }} />
                        <div style={{ fontWeight: 700, color: '#374151' }}>No products found</div>
                        <div style={{ fontSize: '12px' }}>Try adjusting your search query or click "Add Product" to create one.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map(part => {
                      const isFeat = (part as any).isFeatured;
                      const isDeal = (part as any).isDeal || ((part.originalPrice || 0) > part.price);

                      return (
                        <tr key={part.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={part.images?.[0] || 'https://via.placeholder.com/44'}
                                alt=""
                                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0 }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, color: '#111827' }}>{part.nameEn}</div>
                                <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                  <span>SKU: <strong>{part.sku}</strong></span>
                                  <span>OEM: <strong>{part.oemNumber}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#374151' }}>{part.category}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>{part.brand}</div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: isDeal ? '#E53935' : '#111827', fontSize: '14px' }}>
                              {part.price.toFixed(2)} SAR
                            </div>
                            {part.originalPrice && part.originalPrice > part.price && (
                              <div style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                                {part.originalPrice.toFixed(2)} SAR
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '12px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: part.stock === 0 ? '#FEE2E2' : part.stock <= 5 ? '#FEF3C7' : '#ECFDF5',
                                color: part.stock === 0 ? '#B91C1C' : part.stock <= 5 ? '#B45309' : '#059669'
                              }}>
                                {part.stock} units
                              </span>
                              <button
                                onClick={() => setStockAdjustModal({ isOpen: true, part, quantity: part.stock })}
                                title="Adjust Stock"
                                style={{
                                  background: '#F3F4F6',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  padding: '3px 6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  color: '#374151'
                                }}
                              >
                                Edit Stock
                              </button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                              {part.warehouseLocation || 'Riyadh Hub'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleToggleFeatured(part)}
                                title="Toggle Featured status"
                                style={{
                                  backgroundColor: isFeat ? '#FEF3C7' : '#F3F4F6',
                                  color: isFeat ? '#92400E' : '#6B7280',
                                  border: `1px solid ${isFeat ? '#FCD34D' : '#D1D5DB'}`,
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Sparkles size={11} />
                                <span>{isFeat ? 'Featured' : '+ Feature'}</span>
                              </button>

                              <button
                                onClick={() => setDealModal({
                                  isOpen: true,
                                  part,
                                  salePrice: part.price,
                                  originalPrice: part.originalPrice || Math.round(part.price * 1.2),
                                  discountPercent: 15,
                                  dealBadge: (part as any).dealBadge || 'SPECIAL OFFER',
                                  isFeatured: !!(part as any).isFeatured
                                })}
                                title="Set discount deal"
                                style={{
                                  backgroundColor: isDeal ? '#FEE2E2' : '#F3F4F6',
                                  color: isDeal ? '#B91C1C' : '#6B7280',
                                  border: `1px solid ${isDeal ? '#FCA5A5' : '#D1D5DB'}`,
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Flame size={11} />
                                <span>{isDeal ? 'Deal Active' : '+ Deal'}</span>
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEdit(part)}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  color: '#374151',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </button>

                              {onDeletePart && (
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(
                                      `Delete product "${part.nameEn}" (SKU ${part.sku})?\n\n` +
                                      'This cannot be undone. Products that appear on past orders ' +
                                      'should be set to DISABLED instead so order history stays intact.'
                                    )) return;
                                    setSaveError(null);
                                    try {
                                      await apiDelete(`/api/admin/products/${part.id}`);
                                      onDeletePart(part.id);
                                      onRefreshAllData();
                                    } catch (err) {
                                      setSaveError(
                                        `"${part.nameEn}" could not be deleted: ${(err as ApiError).message}`
                                      );
                                    }
                                  }}
                                  style={{
                                    padding: '6px 8px',
                                    backgroundColor: '#FEE2E2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '6px',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEALS */}
        {activeTab === 'deals' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Active Store Deals & Clearance Items
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Items with promotional discounts displayed in the Deals section of the store
                </p>
              </div>
            </div>

            {dealParts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                <Flame size={36} color="#E53935" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>No Active Deals on the Store</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  Select any product below to set discounted pricing and a promotional badge.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {dealParts.map(part => {
                  const discount = part.originalPrice ? Math.round(((part.originalPrice - part.price) / part.originalPrice) * 100) : 15;

                  return (
                    <div
                      key={part.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #FECACA',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(229,57,53,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <img src={part.images?.[0] || 'https://via.placeholder.com/60'} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                            {(part as any).dealBadge || `${discount}% OFF`}
                          </span>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginTop: '4px' }}>{part.nameEn}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>SKU: {part.sku}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#E53935' }}>{part.price} SAR</div>
                          {part.originalPrice && (
                            <div style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>{part.originalPrice} SAR</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setDealModal({
                              isOpen: true,
                              part,
                              salePrice: part.price,
                              originalPrice: part.originalPrice || Math.round(part.price * 1.2),
                              discountPercent: discount,
                              dealBadge: (part as any).dealBadge || 'SPECIAL OFFER',
                              isFeatured: !!(part as any).isFeatured
                            })}
                            style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Edit Deal
                          </button>
                          <button
                            onClick={() => {
                              if (onUpdatePart) {
                                onUpdatePart({ ...part, isDeal: false, originalPrice: undefined });
                              }
                            }}
                            style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Product to Deals */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#374151', margin: '0 0 12px 0' }}>
                Add Another Product to Deals & Clearance
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {parts.filter(p => !dealParts.some(dp => dp.id === p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setDealModal({
                      isOpen: true,
                      part: p,
                      salePrice: Math.round(p.price * 0.85),
                      originalPrice: p.price,
                      discountPercent: 15,
                      dealBadge: '15% OFF',
                      isFeatured: !!(p as any).isFeatured
                    })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <Plus size={13} color="#E53935" />
                    <span style={{ fontWeight: 600, color: '#111827' }}>{p.nameEn}</span>
                    <span style={{ color: '#6B7280' }}>({p.price} SAR)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FEATURED */}
        {activeTab === 'featured' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Homepage Featured Showcase Manager
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Manage the products highlighted in the primary Featured section of the store
                </p>
              </div>
            </div>

            {featuredParts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                <Sparkles size={36} color="#D97706" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>No Items Selected as Featured</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  Pick products below to promote them on the storefront homepage.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {featuredParts.map(part => (
                  <div
                    key={part.id}
                    style={{
                      border: '1px solid #FCD34D',
                      backgroundColor: '#FFFDF5',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <img src={part.images?.[0] || 'https://via.placeholder.com/60'} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          FEATURED
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginTop: '4px' }}>{part.nameEn}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{part.brand} • {part.category}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #FEF08A', paddingTop: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{part.price} SAR</div>
                      <button
                        onClick={() => handleToggleFeatured(part)}
                        style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove from Featured
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add To Featured */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#374151', margin: '0 0 12px 0' }}>
                Add More Products to Featured
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {parts.filter(p => !featuredParts.some(fp => fp.id === p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleToggleFeatured(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <Plus size={13} color="#D97706" />
                    <span style={{ fontWeight: 600, color: '#111827' }}>{p.nameEn}</span>
                    <span style={{ color: '#6B7280' }}>({p.price} SAR)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS */}
        {activeTab === 'orders' && (
          <AdminOrdersPanel lang={lang} onDataChanged={onRefreshAllData} />
        )}

        {activeTab === 'discounts' && (
          <AdminDiscountsPanel lang={lang} />
        )}

        {/* TAB 6: VEHICLE MAKES */}
        {activeTab === 'makes' && (
          <VehicleManufacturerManager
            makes={makes}
            onRefresh={onRefreshAllData}
            lang={lang}
          />
        )}

        {/* TAB 7: TAXONOMY */}
        {activeTab === 'taxonomy' && (
          <CategoryAndBrandManager
            categories={categories}
            brands={brands}
            qualityGrades={qualityGrades}
            onRefresh={onRefreshAllData}
            lang={lang}
          />
        )}

      </main>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      
      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>
                    {editingPart ? 'Edit Product Item' : 'Add New Inventory SKU'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                    Configure SKU specs, inventory quantity, deals, and featured state.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Product Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brembo Front Brake Disc Rotor"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Product Name (Arabic)
                  </label>
                  <input
                    type="text"
                    placeholder="هوب فرامل أمامي أصلي"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BRK-TOY-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    OEM Part Number
                  </label>
                  <input
                    type="text"
                    placeholder="43512-60190"
                    value={formData.oemNumber}
                    onChange={(e) => setFormData({ ...formData, oemNumber: e.target.value })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={formData.categorySlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const catNames: Record<string, string> = {
                        'brakes': 'Braking Systems',
                        'engine-parts': 'Engine & Exhaust',
                        'filters': 'Filters & Intake',
                        'fluids': 'Oils & Fluids',
                        'wheels': 'Alloy Wheels & Tires',
                        'ignition': 'Ignition & Electrical'
                      };
                      setFormData({ ...formData, categorySlug: slug, category: catNames[slug] || 'Automotive Parts' });
                    }}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    <option value="brakes">Braking Systems</option>
                    <option value="engine-parts">Engine & Exhaust</option>
                    <option value="filters">Filters & Intake</option>
                    <option value="fluids">Oils & Fluids</option>
                    <option value="wheels">Alloy Wheels & Tires</option>
                    <option value="ignition">Ignition & Electrical</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota Genuine / Brembo"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Selling Price (SAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Original Price (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Add to Featured Section</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>Display this item in the Featured section on homepage</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#E53935', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Add to Deals & Clearance</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>Activates promotional discount in Deals section</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isDeal}
                    onChange={(e) => setFormData({ ...formData, isDeal: e.target.checked, hasDiscount: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#E53935', cursor: 'pointer' }}
                  />
                </div>

                {formData.isDeal && (
                  <div style={{ marginTop: '6px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '3px' }}>Deal Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% OFF / CLEARANCE"
                      value={formData.dealBadge}
                      onChange={(e) => setFormData({ ...formData, dealBadge: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '0 10px', fontSize: '12px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#E53935', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingPart ? 'Save Changes' : 'Create Product SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUST MODAL */}
      {stockAdjustModal.isOpen && stockAdjustModal.part && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#111827' }}>Quick Stock Adjustment</h3>
              <button onClick={() => setStockAdjustModal({ isOpen: false, part: null, quantity: 0 })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
              Updating count for: <strong style={{ color: '#111827' }}>{stockAdjustModal.part.nameEn}</strong>
            </div>
            <form onSubmit={handleSaveStock}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Warehouse Stock Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => setStockAdjustModal(prev => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>-</button>
                  <input type="number" min="0" value={stockAdjustModal.quantity} onChange={(e) => setStockAdjustModal({ ...stockAdjustModal, quantity: Number(e.target.value) })} style={{ flex: 1, height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', textAlign: 'center', fontSize: '16px', fontWeight: 800 }} />
                  <button type="button" onClick={() => setStockAdjustModal(prev => ({ ...prev, quantity: prev.quantity + 5 }))} style={{ padding: '0 12px', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>+5</button>
                  <button type="button" onClick={() => setStockAdjustModal(prev => ({ ...prev, quantity: prev.quantity + 10 }))} style={{ padding: '0 12px', height: '40px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>+10</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setStockAdjustModal({ isOpen: false, part: null, quantity: 0 })} style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#E53935', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Save Stock Units</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DEAL / DISCOUNT MODAL */}
      {dealModal.isOpen && dealModal.part && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#E53935" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#111827' }}>Flash Deal Setup</h3>
              </div>
              <button onClick={() => setDealModal({ isOpen: false, part: null, salePrice: 0, originalPrice: 0, discountPercent: 0, dealBadge: '', isFeatured: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
              Configure deal price for: <strong style={{ color: '#111827' }}>{dealModal.part.nameEn}</strong>
            </div>
            <form onSubmit={handleSaveDeal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Sale Price (SAR) *</label>
                  <input type="number" min="0" step="0.5" required value={dealModal.salePrice} onChange={(e) => setDealModal({ ...dealModal, salePrice: Number(e.target.value) })} style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '0 10px', fontSize: '13px', fontWeight: 800, color: '#E53935' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Regular Price (SAR)</label>
                  <input type="number" min="0" step="0.5" required value={dealModal.originalPrice} onChange={(e) => setDealModal({ ...dealModal, originalPrice: Number(e.target.value) })} style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '0 10px', fontSize: '13px', textDecoration: 'line-through', color: '#6B7280' }} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Deal Badge Text</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {['10% OFF', '15% OFF', '25% OFF', 'CLEARANCE', 'SPECIAL OFFER'].map(badge => (
                    <button key={badge} type="button" onClick={() => setDealModal({ ...dealModal, dealBadge: badge })} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: dealModal.dealBadge === badge ? '#E53935' : '#F9FAFB', color: dealModal.dealBadge === badge ? '#ffffff' : '#374151', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{badge}</button>
                  ))}
                </div>
                <input type="text" value={dealModal.dealBadge} onChange={(e) => setDealModal({ ...dealModal, dealBadge: e.target.value })} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #D1D5DB', padding: '0 10px', fontSize: '12px' }} />
              </div>

              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="dealFeatureCheck" checked={dealModal.isFeatured} onChange={(e) => setDealModal({ ...dealModal, isFeatured: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#E53935', cursor: 'pointer' }} />
                <label htmlFor="dealFeatureCheck" style={{ fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Also display in Featured section</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setDealModal({ isOpen: false, part: null, salePrice: 0, originalPrice: 0, discountPercent: 0, dealBadge: '', isFeatured: false })} style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#E53935', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Apply Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
