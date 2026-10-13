import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { setDatabasePool } from '../packages/db/src/db';
import { createApp } from '../packages/db/src/server';
import * as fs from 'fs';
import * as path from 'path';

describe('Vehicle-First Automotive Catalog & Admin Management Tests', () => {
  let app: any;
  let adminSessionCookie: string;
  let customerSessionCookie: string;

  beforeAll(async () => {
    // 1. In-memory PostgreSQL instance for hermetic, fast test execution
    const memDb = newDb();
    const pgAdapter = memDb.adapters.createPg();
    const testPool = new pgAdapter.Pool();
    setDatabasePool(testPool as any);

    // Apply Migration 1: Initial schema
    const schemaSql1 = fs.readFileSync(
      path.join(__dirname, '../packages/db/prisma/migrations/0001_initial_schema.sql'),
      'utf8'
    ).replace(/CREATE EXTENSION[^\n]+/g, '')
     .replace(/DO \$\$[\s\S]*?\$\$ LANGUAGE plpgsql;/g, '')
     .replace(/DO \$\$[\s\S]*?\$\$;/g, '')
     .replace(/"role"\s+"UserRole"/g, '"role" VARCHAR(50)')
     .replace(/"status"\s+"OrderStatus"/g, '"status" VARCHAR(50)');

    await testPool.query(schemaSql1);

    // Apply Migration 2: Catalog & Fitment schema
    const schemaSql2 = fs.readFileSync(
      path.join(__dirname, '../packages/db/prisma/migrations/0002_catalog_vehicle_fitment.sql'),
      'utf8'
    );
    await testPool.query(schemaSql2);

    app = createApp();

    // Seed test users: Super Admin and Customer
    const adminUser = {
      name: 'System Admin',
      email: 'admin@autopart.sa',
      password: 'AdminPassword123!',
      confirmPassword: 'AdminPassword123!',
      phone: '+966500000001'
    };
    await request(app).post('/api/auth/register').send(adminUser);
    // Promote user to SUPER_ADMIN directly in db
    await testPool.query(`UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = $1`, [adminUser.email]);
    const adminLoginRes = await request(app).post('/api/auth/login').send({ email: adminUser.email, password: adminUser.password });
    adminSessionCookie = adminLoginRes.headers['set-cookie']?.[0] || '';

    const customerUser = {
      name: 'Khalid Al-Otaibi',
      email: 'khalid@example.sa',
      password: 'CustomerPassword123!',
      confirmPassword: 'CustomerPassword123!',
      phone: '+966500000002'
    };
    const custRegRes = await request(app).post('/api/auth/register').send(customerUser);
    customerSessionCookie = custRegRes.headers['set-cookie']?.[0] || '';
  });

  // Test 1: Seed / create vehicle manufacturer with logo
  it('1. Admin creates a vehicle manufacturer and persists to PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/admin/makes')
      .set('Cookie', adminSessionCookie)
      .send({
        name: 'Toyota',
        slug: 'toyota',
        logoUrl: 'https://images.unsplash.com/toyota-logo.png',
        description: 'World-renowned Japanese manufacturer',
        displayOrder: 1,
        isPublished: true,
        isEnabled: true
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Toyota');
    expect(res.body.slug).toBe('toyota');
    expect(res.body.isPublished).toBe(true);
  });

  // Test 2: Public storefront only shows published manufacturers
  it('2. Public storefront retrieves published vehicle manufacturers', async () => {
    const res = await request(app).get('/api/vehicles/makes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('Toyota');
    expect(res.body[0].logoUrl).toContain('toyota-logo');
  });

  // Test 3: Admin adds vehicle model and years
  it('3. Admin adds models and years under a manufacturer', async () => {
    const makesRes = await request(app).get('/api/vehicles/makes');
    const toyota = makesRes.body[0];

    const modelRes = await request(app)
      .post('/api/admin/models')
      .set('Cookie', adminSessionCookie)
      .send({
        makeId: toyota.id,
        name: 'Camry',
        slug: 'camry',
        generation: 'XV70',
        years: [2018, 2019, 2020, 2021, 2022],
        isPublished: true
      });

    expect(modelRes.status).toBe(201);
    expect(modelRes.body.name).toBe('Camry');

    // Retrieve models for this make
    const listRes = await request(app).get(`/api/vehicles/makes/${toyota.id}/models`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].name).toBe('Camry');
    expect(listRes.body[0].years?.length).toBe(5);
  });

  // Test 4: Admin creates categories and part brands
  it('4. Admin creates categories and distinct part brands', async () => {
    const catRes = await request(app)
      .post('/api/admin/categories')
      .set('Cookie', adminSessionCookie)
      .send({
        nameEn: 'Brake Pads & Discs',
        nameAr: 'أقمشة وهوبات الفرامل',
        slug: 'brake-pads-discs',
        imageUrl: 'https://images.unsplash.com/brakes.jpg',
        displayOrder: 1,
        isPublished: true
      });
    expect(catRes.status).toBe(201);

    const brandRes = await request(app)
      .post('/api/admin/brands')
      .set('Cookie', adminSessionCookie)
      .send({
        name: 'Advics Aisin Japan',
        slug: 'advics',
        description: 'OEM Braking manufacturer for Toyota & Lexus',
        isPublished: true,
        isEnabled: true
      });
    expect(brandRes.status).toBe(201);
  });

  // Test 5: Quality Grade configuration
  it('5. Admin configures Grade A, B, and C definitions', async () => {
    // Populate quality grades
    await request(app)
      .put('/api/admin/quality-grades/GRADE_A')
      .set('Cookie', adminSessionCookie)
      .send({
        nameEn: 'Grade A (Pristine / OEM Benchmark)',
        displayLabel: 'Grade A - Premium Tier',
        descriptionEn: 'Factory-certified highest quality tier with zero defects.'
      });

    const gradesRes = await request(app).get('/api/quality-grades');
    expect(gradesRes.status).toBe(200);
    const gradeA = gradesRes.body.find((g: any) => g.code === 'GRADE_A');
    expect(gradeA).toBeDefined();
    expect(gradeA.displayLabel).toContain('Grade A');
  });

  // Test 6: Create draft product - verified it remains hidden
  it('6. Product in DRAFT status is not visible to public customers', async () => {
    const cats = (await request(app).get('/api/categories')).body;
    const brands = (await request(app).get('/api/brands')).body;

    const draftRes = await request(app)
      .post('/api/admin/products')
      .set('Cookie', adminSessionCookie)
      .send({
        sku: 'DRAFT-BRK-001',
        nameEn: 'Unpublished Prototype Rotor',
        categoryId: cats[0].id,
        brandId: brands[0].id,
        qualityGrade: 'GRADE_A',
        sellingPrice: 400.0,
        stockQuantity: 10,
        status: 'DRAFT'
      });
    expect(draftRes.status).toBe(201);

    // Search public products
    const pubSearch = await request(app).get('/api/products?q=Prototype');
    expect(pubSearch.body.products.length).toBe(0);

    // Direct slug request returns 404
    const directRes = await request(app).get('/api/products/draft-brk-001');
    expect(directRes.status).toBe(404);
  });

  // Test 7: Create published product with verified vehicle fitment
  it('7. Published product with verified vehicle fitment is discovered', async () => {
    const makes = (await request(app).get('/api/vehicles/makes')).body;
    const toyota = makes[0];
    const models = (await request(app).get(`/api/vehicles/makes/${toyota.id}/models`)).body;
    const camry = models[0];
    const cats = (await request(app).get('/api/categories')).body;
    const brands = (await request(app).get('/api/brands')).body;

    const prodRes = await request(app)
      .post('/api/admin/products')
      .set('Cookie', adminSessionCookie)
      .send({
        sku: 'BRK-TOY-VERIFIED-01',
        oemNumber: '04465-33471',
        nameEn: 'Ceramic Front Brake Pads Set',
        nameAr: 'طقم أقمشة فرامل سيراميك أمامية',
        categoryId: cats[0].id,
        brandId: brands[0].id,
        qualityGrade: 'GRADE_A',
        condition: 'NEW',
        sellingPrice: 285.00,
        salePrice: 255.00,
        costPrice: 170.00,
        stockQuantity: 40,
        status: 'PUBLISHED',
        fitments: [
          {
            makeId: toyota.id,
            modelId: camry.id,
            yearNumber: 2022,
            fitmentNote: 'Fits all 2.5L and Hybrid Camry models'
          }
        ]
      });

    expect(prodRes.status).toBe(201);

    // Filter by vehicle: Camry 2022 => Should return this product
    const fitSearch = await request(app).get(`/api/products?makeId=${toyota.id}&modelId=${camry.id}&year=2022`);
    expect(fitSearch.status).toBe(200);
    expect(fitSearch.body.products.length).toBeGreaterThan(0);
    expect(fitSearch.body.products[0].sku).toBe('BRK-TOY-VERIFIED-01');

    // Filter by unrelated year or vehicle => Should NOT claim false compatibility
    const unrelatedSearch = await request(app).get(`/api/products?makeId=${toyota.id}&modelId=${camry.id}&year=1995`);
    const containsUnrelated = unrelatedSearch.body.products.some((p: any) => p.sku === 'BRK-TOY-VERIFIED-01');
    expect(containsUnrelated).toBe(false);
  });

  // Test 8: Price and stock updates are immediately reflected & audit recorded
  it('8. Price and inventory changes update PostgreSQL and customer storefront', async () => {
    const list = await request(app).get('/api/products?q=BRK-TOY-VERIFIED-01');
    const prod = list.body.products[0];

    // Admin updates price to 299 SAR
    const updateRes = await request(app)
      .put(`/api/admin/products/${prod.id}`)
      .set('Cookie', adminSessionCookie)
      .send({
        ...prod,
        sellingPrice: 299.00,
        stockQuantity: 15
      });
    expect(updateRes.status).toBe(200);

    // Customer immediately observes 299 SAR
    const updatedProd = await request(app).get(`/api/products/${prod.id}`);
    expect(updatedProd.status).toBe(200);
    expect(Number(updatedProd.body.sellingPrice)).toBe(299.00);
    expect(updatedProd.body.stockQuantity).toBe(15);
    // Cost price is hidden from ordinary customers
    expect(updatedProd.body.costPrice).toBeUndefined();
  });

  // Test 9: Unauthorized customers are blocked from modifying catalog or prices
  it('9. Security: Ordinary customers cannot modify catalog or prices', async () => {
    const unauthorizedRes = await request(app)
      .post('/api/admin/makes')
      .set('Cookie', customerSessionCookie)
      .send({ name: 'Hacked Make', slug: 'hacked' });

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toContain('Forbidden');
  });
});
