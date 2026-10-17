import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { setDatabasePool } from '../packages/db/src/db';
import { createApp } from '../packages/db/src/server';
import * as fs from 'fs';
import * as path from 'path';

describe('AutoPart Full-Stack Authentication & API Tests', () => {
  let app: any;

  beforeAll(async () => {
    // 1. Create an in-memory PostgreSQL instance for hermetic, ultra-fast test execution
    const memDb = newDb();
    
    const pgAdapter = memDb.adapters.createPg();
    const testPool = new pgAdapter.Pool();
    setDatabasePool(testPool as any);

    // Run 0001_initial_schema.sql
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '../packages/db/prisma/migrations/0001_initial_schema.sql'),
      'utf8'
    );
    // pg-mem doesn't need extensions block or DO block
    const cleanedSql = schemaSql
      .replace(/CREATE EXTENSION[^\n]+/g, '')
      .replace(/DO \$\$[\s\S]*?\$\$ LANGUAGE plpgsql;/g, '')
      .replace(/DO \$\$[\s\S]*?\$\$;/g, '')
      .replace(/"role"\s+"UserRole"/g, '"role" VARCHAR(50)')
      .replace(/"status"\s+"OrderStatus"/g, '"status" VARCHAR(50)');

    await testPool.query(cleanedSql);

    app = createApp();
  });

  const testUser = {
    name: 'Tariq Al-Harbi',
    email: 'tariq.alharbi@example.sa',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    phone: '+966509876543'
  };

  let sessionCookie: string;

  it('1. Rejects invalid registration (short password, invalid email)', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'not-an-email' });
    expect(res1.status).toBe(400);
    expect(res1.body.error).toContain('valid email');

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, password: '123', confirmPassword: '123' });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('8 characters');

    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, confirmPassword: 'mismatch' });
    expect(res3.status).toBe(400);
    expect(res3.body.error).toContain('does not match');
  });

  it('2. Successfully registers a new customer with hashed password in PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.role).toBe('CUSTOMER'); // Never admin by default
    expect(res.body.user.passwordHash).toBeUndefined(); // Never leaks hash in API

    // Verify cookie set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('autopart_session=');
  });

  it('3. Rejects duplicate registration for the same email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('4. Rejects login with incorrect password without exposing account existence', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email address or password');
  });

  it('5. Successfully logs in with valid credentials, sets HttpOnly session cookie, and returns user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    sessionCookie = cookies[0].split(';')[0];
    expect(sessionCookie).toContain('autopart_session=');
  });

  it('6. Authenticated user can fetch /api/auth/me using session cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe(testUser.name);
  });

  it('7. Unauthenticated request to /api/auth/me is rejected (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Authentication required');
  });

  it('8. Guest cart persists and seamlessly merges into customer cart on login', async () => {
    const guestCart = [
      { productId: 'part-brakes-01', quantity: 2 },
      { productId: 'part-filter-02', quantity: 1 }
    ];

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        guestCart
      });

    expect(res.status).toBe(200);
    expect(res.body.cartItems).toBeDefined();
    expect(res.body.cartItems.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Tests 9 and 10 used to assert the two behaviours this work removed:
   *
   *   9.  guest checkout is rejected with 401 — guest checkout is now a
   *       requirement, so /api/orders/checkout no longer demands a session;
   *   10. a `price` sent by the client becomes the order subtotal, and the
   *       order is stored as paymentStatus "Paid" with no payment at all.
   *
   * Both are now covered by src/commerce.test.ts, which runs against real
   * PostgreSQL because the checkout path relies on SELECT … FOR UPDATE,
   * ON CONFLICT and COUNT(*) FILTER — none of which pg-mem implements.
   */
  it('9. Checkout no longer requires authentication (guest checkout)', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({
        items: [{ productId: 'part-1', quantity: 1 }],
        customerName: 'Guest Person',
        customerEmail: 'guest.person@example.sa',
        customerPhone: '+966501112233',
        city: 'Jeddah',
        address: 'Al Andalus District, Street 7'
      });

    // The guard is gone; whatever happens next, it is not an auth rejection.
    expect(res.status).not.toBe(401);
  });

  it('10. Checkout refuses a client-supplied price for an unknown product', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Cookie', sessionCookie)
      .send({
        items: [
          { productId: 'part-01', nameEn: 'Ceramic Brake Pads', price: 285.50, quantity: 2 }
        ],
        customerName: testUser.name,
        customerEmail: testUser.email,
        customerPhone: testUser.phone,
        city: 'Riyadh',
        address: 'Al Malqa, Anas Ibn Malik Rd',
        paymentMethod: 'mada'
      });

    // 'part-01' is not in the catalogue, so there is no price to trust. What
    // matters is that no order is created at the client's 285.50 — previously
    // this returned 201 with subtotal 571 and paymentStatus "Paid".
    //
    // The exact rejection code is asserted in commerce.test.ts; pg-mem cannot
    // execute the catalogue price lookup (= ANY($1::text[])), so here we only
    // assert that nothing was persisted.
    expect(res.status).not.toBe(201);

    const { query } = await import('../packages/db/src/db');
    const orders = await query('SELECT * FROM "Order"');
    expect(orders.rowCount).toBe(0);
  });

  it('11. Customer role cannot access admin-only endpoints', async () => {
    // Define an admin-only endpoint test
    const testAdminApp = createApp();
    const { requireAuth, requireRole } = await import('../packages/db/src/apiRoutes');
    testAdminApp.get('/api/admin/system', requireAuth, requireRole('SUPER_ADMIN'), (req, res) => {
      res.json({ secret: 'admin-data' });
    });

    const res = await request(testAdminApp)
      .get('/api/admin/system')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('12. Logout invalidates session and clears cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);

    // Verify that old session cookie can no longer access /api/auth/me
    const afterLogout = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(afterLogout.status).toBe(401);
  });
});
