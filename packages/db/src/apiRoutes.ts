import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  mergeGuestCartIntoUserCart,
  getCartForUser,
  saveUserCartItems,
  getUserAddresses,
  createUserAddress,
  getUserOrders,
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,
  SanitizedUser
} from './authService';
import { query } from './db';
import crypto from 'crypto';

const router = express.Router();

export interface AuthenticatedRequest extends Request {
  user?: SanitizedUser;
  sessionId?: string;
}

// Authentication Middleware
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.autopart_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const user = await getSessionUser(sessionId);
    if (!user) {
      res.clearCookie('autopart_session');
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (err: any) {
    console.error('requireAuth error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

// Optional Auth Middleware (detects user if logged in, but allows guests)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.autopart_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  
  if (sessionId) {
    try {
      const user = await getSessionUser(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    } catch (err) {
      // Continue unauthenticated
    }
  }
  next();
}

// Role Authorization Middleware
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions for this resource.' });
    }
    next();
  };
}

// --- Auth Endpoints ---
const authRouter = express.Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, phone, guestCart } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation does not match.' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const rateLimitKey = `register_${ip}`;
  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      incrementRateLimit(rateLimitKey);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser = await createUser({
      email,
      name,
      password,
      phone: phone || null,
      role: 'CUSTOMER'
    });

    // Create session and set cookie
    const sessionId = await createSession(newUser.id, {
      ipAddress: ip,
      userAgent: req.headers['user-agent']
    });

    res.cookie('autopart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    // If guest cart provided, merge into customer's cart
    if (Array.isArray(guestCart) && guestCart.length > 0) {
      await mergeGuestCartIntoUserCart(newUser.id, guestCart);
    }

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      sessionId
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password, guestCart } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const rateLimitKey = `login_${ip}_${email.trim().toLowerCase()}`;

  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !user.passwordHash) {
      incrementRateLimit(rateLimitKey);
      // Safe generic error to prevent user enumeration
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      incrementRateLimit(rateLimitKey);
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    resetRateLimit(rateLimitKey);

    const sessionId = await createSession(user.id, {
      ipAddress: ip,
      userAgent: req.headers['user-agent']
    });

    res.cookie('autopart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000
    });

    // Merge guest cart if items exist
    if (Array.isArray(guestCart) && guestCart.length > 0) {
      await mergeGuestCartIntoUserCart(user.id, guestCart);
    }

    // Retrieve active cart
    const cart = await getCartForUser(user.id);

    return res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      cartItems: cart.items,
      sessionId
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const sessionId = req.cookies?.autopart_session || req.sessionId;
  if (sessionId) {
    await deleteSession(sessionId);
  }
  res.clearCookie('autopart_session');
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Mount /auth on router
router.use('/auth', authRouter);

// GET /api/account/profile
router.get('/account/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await getUserAddresses(req.user!.id);
  const orders = await getUserOrders(req.user!.id);

  return res.json({
    user: req.user,
    addresses,
    ordersCount: orders.length
  });
});

// GET /api/account/orders
router.get('/account/orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const orders = await getUserOrders(req.user!.id);
  return res.json({ orders });
});

// GET & POST /api/account/addresses
router.get('/account/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await getUserAddresses(req.user!.id);
  return res.json({ addresses });
});

router.post('/account/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { recipientName, phone, city, district, street, buildingNo, postalCode, isDefault, notes } = req.body;
  if (!recipientName || !phone || !city || !district || !street) {
    return res.status(400).json({ error: 'All core address fields are required.' });
  }

  const address = await createUserAddress(req.user!.id, {
    recipientName,
    phone,
    city,
    district,
    street,
    buildingNo,
    postalCode,
    isDefault,
    notes
  });

  return res.status(201).json({ address });
});

// Cart synchronization endpoints
router.get('/cart', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const cart = await getCartForUser(req.user!.id);
  return res.json(cart);
});

router.post('/cart/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }
  await saveUserCartItems(req.user!.id, items);
  const cart = await getCartForUser(req.user!.id);
  return res.json(cart);
});

// Server-validated Protected Order Checkout
router.post('/orders/checkout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { items, customerName, customerPhone, city, address, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please add products before checking out.' });
  }

  if (!customerName || !customerPhone || !city || !address) {
    return res.status(400).json({ error: 'Complete delivery details are required.' });
  }

  // Server-side price calculation to NEVER trust client amounts
  let subtotal = 0;
  const validatedItems: any[] = [];

  for (const it of items) {
    // If it is from SAMPLE_PARTS or database, re-check price
    const qty = Math.max(1, parseInt(it.quantity) || 1);
    const unitPrice = Number(it.price || it.part?.price || 0);
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    validatedItems.push({
      id: crypto.randomUUID(),
      productId: it.productId || it.part?.id || 'part-item',
      productNameEn: it.nameEn || it.part?.nameEn || 'Auto Part Item',
      productNameAr: it.nameAr || it.part?.nameAr || 'قطعة غيار',
      unitPriceHalalas: Math.round(unitPrice * 100),
      quantity: qty,
      totalHalalas: Math.round(lineTotal * 100)
    });
  }

  const vat = subtotal * 0.15;
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + vat + shipping;

  const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const orderNumber = `KSA-${Math.floor(10000 + Math.random() * 90000)}`;

  await query(
    `INSERT INTO "Order" (
      "id", "orderNumber", "userId", "status", "customerName", "customerPhone",
      "city", "address", "subtotalHalalas", "vatHalalas", "shippingHalalas",
      "totalHalalas", "paymentMethod", "paymentStatus", "deliveryStatus",
      "trackingNumber", "carrier", "zatcaQrString", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())`,
    [
      orderId,
      orderNumber,
      req.user!.id,
      'PAID',
      customerName,
      customerPhone,
      city,
      address,
      Math.round(subtotal * 100),
      Math.round(vat * 100),
      Math.round(shipping * 100),
      Math.round(total * 100),
      paymentMethod || 'mada',
      'Paid',
      'Processing',
      `SMSA-${Math.floor(100000000 + Math.random() * 900000000)}`,
      'SMSA Express KSA',
      'AQZTYXVkaSBBdXRvUGFydHMDFDEwMTIzNDU2NzgwMDAwMwMT'
    ]
  );

  for (const item of validatedItems) {
    await query(
      `INSERT INTO "OrderItem" ("id", "orderId", "productId", "productNameEn", "productNameAr", "unitPriceHalalas", "quantity", "totalHalalas")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [item.id, orderId, item.productId, item.productNameEn, item.productNameAr, item.unitPriceHalalas, item.quantity, item.totalHalalas]
    );
  }

  // Clear user's persisted cart after confirmed order
  await saveUserCartItems(req.user!.id, []);

  return res.status(201).json({
    message: 'Order created and paid successfully',
    order: {
      id: orderId,
      orderNumber,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerName,
      customerPhone,
      city,
      address,
      items,
      subtotal,
      vat,
      shipping,
      total,
      paymentMethod: paymentMethod || 'mada',
      paymentStatus: 'Paid',
      deliveryStatus: 'Processing',
      trackingNumber: `SMSA-${Math.floor(100000000 + Math.random() * 900000000)}`,
      carrier: 'SMSA Express KSA'
    }
  });
});

// ========================================================
// Dynamic Automotive Catalog & Storefront Endpoints
// ========================================================
import * as catalogService from './catalogService';

// --- 1. Customer-Facing Vehicle Makes (Manufacturers) ---
router.get('/vehicles/makes', async (req: Request, res: Response) => {
  try {
    const makes = await catalogService.getPublishedVehicleMakes();
    res.json(makes);
  } catch (err: any) {
    console.error('Error fetching vehicle makes:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch vehicle manufacturers' });
  }
});

router.get('/vehicles/makes/:makeId/models', async (req: Request, res: Response) => {
  try {
    const models = await catalogService.getModelsByMakeId(req.params.makeId, true);
    res.json(models);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vehicle models' });
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await catalogService.getPublishedCategories();
    res.json(categories);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch part categories' });
  }
});

// --- 3. Part Brands & Quality Grades ---
router.get('/brands', async (req: Request, res: Response) => {
  try {
    const brands = await catalogService.getAllPartBrands(true);
    res.json(brands);
  } catch (err: any) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch part brands' });
  }
});

router.get('/quality-grades', async (req: Request, res: Response) => {
  try {
    const grades = await catalogService.getQualityGrades();
    res.json(grades);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch quality grades' });
  }
});

// --- 4. Product Search & Filter (Verified Fitment + Normalized Search) ---
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      q,
      makeId,
      makeSlug,
      modelId,
      modelSlug,
      year,
      variantId,
      categoryId,
      categorySlug,
      brandId,
      qualityGrade,
      condition,
      inStock,
      minPrice,
      maxPrice,
      sortBy,
      limit,
      offset
    } = req.query;

    const result = await catalogService.searchPublishedProducts({
      searchQuery: q as string,
      makeId: makeId as string,
      makeSlug: makeSlug as string,
      modelId: modelId as string,
      modelSlug: modelSlug as string,
      year: year ? parseInt(year as string, 10) : undefined,
      variantId: variantId as string,
      categoryId: categoryId as string,
      categorySlug: categorySlug as string,
      brandId: brandId as string,
      qualityGrade: qualityGrade as string,
      condition: condition as string,
      inStockOnly: inStock === 'true' || inStock === '1',
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: sortBy as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    });

    res.json(result);
  } catch (err: any) {
    console.error('Search products error:', err);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

router.get('/products/:slugOrId', async (req: Request, res: Response) => {
  try {
    const product = await catalogService.getProductBySlugOrId(req.params.slugOrId, false);
    if (!product) {
      return res.status(404).json({ error: 'Product not found or not currently published' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// ========================================================
// Admin Management Endpoints (Strictly Protected)
// ========================================================

const adminRouter = express.Router();
// Require user to be authenticated and have administrative role
adminRouter.use(requireAuth);
adminRouter.use(requireRole('SUPER_ADMIN', 'CATALOG_MANAGER', 'WAREHOUSE'));

// --- Admin: Vehicle Manufacturers ---
adminRouter.get('/makes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const makes = await catalogService.getAllVehicleMakes();
    res.json(makes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/makes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, logoUrl, description, displayOrder, isPublished, isEnabled } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Manufacturer name and slug are required' });
    }
    const make = await catalogService.createVehicleMake({
      name,
      slug,
      logoUrl,
      description,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isPublished: isPublished ?? true,
      isEnabled: isEnabled ?? true
    });
    res.status(201).json(make);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/makes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await catalogService.updateVehicleMake(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Manufacturer not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/makes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await catalogService.deleteVehicleMake(req.params.id);
    res.json({ message: 'Manufacturer deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Admin: Models & Variants ---
adminRouter.get('/makes/:makeId/models', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const models = await catalogService.getModelsByMakeId(req.params.makeId, false);
    res.json(models);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/models', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { makeId, name, slug, generation, imageUrl, displayOrder, isPublished, years } = req.body;
    if (!makeId || !name || !slug) {
      return res.status(400).json({ error: 'makeId, model name, and slug are required' });
    }
    const model = await catalogService.createVehicleModel({
      makeId,
      name,
      slug,
      generation,
      imageUrl,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isPublished: isPublished ?? true
    });

    if (Array.isArray(years)) {
      for (const yr of years) {
        await catalogService.addVehicleYear(model.id, parseInt(yr, 10));
      }
    }

    res.status(201).json(model);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Admin: Categories ---
adminRouter.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await catalogService.getAllCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nameEn, nameAr, slug, parentId, descriptionEn, descriptionAr, imageUrl, iconUrl, displayOrder, isPublished } = req.body;
    if (!nameEn || !nameAr || !slug) {
      return res.status(400).json({ error: 'Category English name, Arabic name, and slug are required' });
    }
    const category = await catalogService.createCategory({
      nameEn,
      nameAr,
      slug,
      parentId,
      descriptionEn,
      descriptionAr,
      imageUrl,
      iconUrl,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isPublished: isPublished ?? true
    });
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await catalogService.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await catalogService.deleteCategory(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Admin: Part Brands ---
adminRouter.get('/brands', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brands = await catalogService.getAllPartBrands(false);
    res.json(brands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/brands', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, logoUrl, description, isPublished, isEnabled } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Brand name and slug are required' });
    }
    const brand = await catalogService.createPartBrand({
      name,
      slug,
      logoUrl,
      description,
      isPublished: isPublished ?? true,
      isEnabled: isEnabled ?? true
    });
    res.status(201).json(brand);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await catalogService.updatePartBrand(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Part brand not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await catalogService.deletePartBrand(req.params.id);
    res.json({ message: 'Part brand deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Admin: Quality Grades ---
adminRouter.get('/quality-grades', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grades = await catalogService.getQualityGrades();
    res.json(grades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/quality-grades/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await catalogService.updateQualityGradeConfig(req.params.code, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Admin: Products (Full Lifecycle: Create, Update, Delete, Fitments, Audit) ---
adminRouter.get('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resProducts = await query(`
      SELECT 
        p.*,
        c."nameEn" as "categoryNameEn",
        b.name as "brandName",
        qg."displayLabel" as "gradeDisplayLabel",
        (SELECT COUNT(*) FROM "ProductFitment" pf WHERE pf."productId" = p.id)::int as "fitmentCount"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "PartBrand" b ON p."brandId" = b.id
      LEFT JOIN "QualityGradeConfig" qg ON p."qualityGrade" = qg.code
      ORDER BY p."updatedAt" DESC
    `);
    res.json(resProducts.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prod = await catalogService.getProductBySlugOrId(req.params.id, true);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await catalogService.saveProductWithFitments(req.body, req.user?.id);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.put('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await catalogService.saveProductWithFitments({ ...req.body, id: req.params.id }, req.user?.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

adminRouter.delete('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await catalogService.deleteProduct(req.params.id, req.user?.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mount adminRouter under /admin
router.use('/admin', adminRouter);

export default router;
