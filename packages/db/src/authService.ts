import { query, runTransaction } from './db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  name: string;
  role: 'CUSTOMER' | 'SUPER_ADMIN' | 'CATALOG_MANAGER' | 'WAREHOUSE' | 'SUPPORT' | 'FINANCE';
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: string;
  createdAt: string;
}

export function sanitizeUser(user: UserRecord): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  };
}

// In-memory rate limiting to protect login / registration against brute-force attacks
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return true;
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(key);
    return true;
  }
  return record.count < MAX_ATTEMPTS;
}

export function incrementRateLimit(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

export function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const res = await query<UserRecord>(
    'SELECT * FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email.trim()]
  );
  return res.rows[0] || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const res = await query<UserRecord>(
    'SELECT * FROM "User" WHERE id = $1 LIMIT 1',
    [id]
  );
  return res.rows[0] || null;
}

export async function createUser(params: {
  email: string;
  name: string;
  password: string;
  phone?: string | null;
  role?: UserRecord['role'];
}): Promise<SanitizedUser> {
  const existing = await findUserByEmail(params.email);
  if (existing) {
    throw new Error('Email address is already registered');
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(params.password);
  const role = params.role || 'CUSTOMER'; // Never grant admin permissions to public signups

  const res = await query<UserRecord>(
    `INSERT INTO "User" ("id", "email", "phone", "passwordHash", "name", "role", "isBlocked", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
     RETURNING *`,
    [id, params.email.toLowerCase().trim(), params.phone || null, passwordHash, params.name.trim(), role]
  );

  return sanitizeUser(res.rows[0]);
}

// Server-managed Sessions
export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export async function createSession(userId: string, options?: { ipAddress?: string; userAgent?: string; ttlHours?: number }): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const ttlHours = options?.ttlHours || 24 * 7; // 7 days default
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  await query(
    `INSERT INTO "Session" ("id", "userId", "expiresAt", "ipAddress", "userAgent", "createdAt")
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [sessionId, userId, expiresAt, options?.ipAddress || null, options?.userAgent || null]
  );

  return sessionId;
}

export async function getSessionUser(sessionId: string): Promise<SanitizedUser | null> {
  if (!sessionId) return null;
  const res = await query<{
    userId: string;
    expiresAt: Date | string;
    user: UserRecord;
  }>(
    `SELECT s."userId", s."expiresAt", u.* 
     FROM "Session" s
     JOIN "User" u ON s."userId" = u."id"
     WHERE s."id" = $1 AND s."expiresAt" > NOW() AND u."isBlocked" = false
     LIMIT 1`,
    [sessionId]
  );

  if (!res.rows[0]) return null;
  return sanitizeUser(res.rows[0] as unknown as UserRecord);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await query('DELETE FROM "Session" WHERE "id" = $1', [sessionId]);
}

// Cart persistence and merging
export async function getCartForUser(userId: string) {
  const res = await query<{ id: string }>('SELECT id FROM "Cart" WHERE "userId" = $1 LIMIT 1', [userId]);
  let cartId: string;
  if (res.rows.length === 0) {
    cartId = crypto.randomUUID();
    await query('INSERT INTO "Cart" ("id", "userId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())', [cartId, userId]);
  } else {
    cartId = res.rows[0].id;
  }

  const itemsRes = await query<{ productId: string; quantity: number }>(
    'SELECT "productId", "quantity" FROM "CartItem" WHERE "cartId" = $1',
    [cartId]
  );

  return { cartId, items: itemsRes.rows };
}

export async function mergeGuestCartIntoUserCart(userId: string, guestItems: { productId: string; quantity: number }[]) {
  if (!guestItems || guestItems.length === 0) return;

  const { cartId } = await getCartForUser(userId);

  for (const item of guestItems) {
    await query(
      `INSERT INTO "CartItem" ("id", "cartId", "productId", "quantity")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("cartId", "productId")
       DO UPDATE SET "quantity" = "CartItem"."quantity" + EXCLUDED."quantity"`,
      [crypto.randomUUID(), cartId, item.productId, item.quantity]
    );
  }
}

export async function saveUserCartItems(userId: string, items: { productId: string; quantity: number }[]) {
  const { cartId } = await getCartForUser(userId);
  await runTransaction(async (client) => {
    await client.query('DELETE FROM "CartItem" WHERE "cartId" = $1', [cartId]);
    for (const item of items) {
      if (item.quantity > 0) {
        await client.query(
          'INSERT INTO "CartItem" ("id", "cartId", "productId", "quantity") VALUES ($1, $2, $3, $4)',
          [crypto.randomUUID(), cartId, item.productId, item.quantity]
        );
      }
    }
  });
}

// User Addresses
export async function getUserAddresses(userId: string) {
  const res = await query(
    'SELECT * FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC',
    [userId]
  );
  return res.rows;
}

export async function createUserAddress(userId: string, address: {
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  buildingNo?: string;
  postalCode?: string;
  nationalCode?: string;
  notes?: string;
  isDefault?: boolean;
}) {
  const id = crypto.randomUUID();
  if (address.isDefault) {
    await query('UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1', [userId]);
  }
  const res = await query(
    `INSERT INTO "Address" ("id", "userId", "isDefault", "recipientName", "phone", "city", "district", "street", "buildingNo", "postalCode", "nationalCode", "notes", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
     RETURNING *`,
    [id, userId, !!address.isDefault, address.recipientName, address.phone, address.city, address.district, address.street, address.buildingNo || null, address.postalCode || null, address.nationalCode || null, address.notes || null]
  );
  return res.rows[0];
}

// User Orders
export async function getUserOrders(userId: string) {
  const ordersRes = await query(
    'SELECT * FROM "Order" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
    [userId]
  );
  const orders = ordersRes.rows;
  for (const order of orders) {
    const itemsRes = await query('SELECT * FROM "OrderItem" WHERE "orderId" = $1', [order.id]);
    order.items = itemsRes.rows;
  }
  return orders;
}
