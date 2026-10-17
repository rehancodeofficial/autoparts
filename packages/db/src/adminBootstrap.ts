/**
 * Creates the administrator account the admin panel signs in with.
 *
 * Before this existed, AdminLoginPage compared "demoadmin"/"demoadmin" in the
 * browser and set a sessionStorage flag. No admin user existed in any
 * database, so every /api/admin/* request was rejected with 401 and the whole
 * panel could not save anything.
 *
 * Credentials come from the environment. The defaults preserve the existing
 * demoadmin login so nothing changes for the current operator, but they are
 * refused in production unless explicitly overridden.
 *
 *   ADMIN_USERNAME  (default "demoadmin")  -> stored as <username>@admin.local
 *   ADMIN_EMAIL     (optional, overrides the derived address)
 *   ADMIN_PASSWORD  (default "demoadmin")
 *   ADMIN_ROLE      (default "SUPER_ADMIN")
 */
import crypto from 'crypto';
import { query } from './db';
import { hashPassword } from './authService';

const DEFAULT_USERNAME = 'demoadmin';
const DEFAULT_PASSWORD = 'demoadmin';

export interface AdminBootstrapResult {
  created: boolean;
  updated: boolean;
  email: string;
  role: string;
  usingDefaultPassword: boolean;
  skipped?: string;
}

export async function ensureAdminUser(): Promise<AdminBootstrapResult> {
  const username = (process.env.ADMIN_USERNAME || DEFAULT_USERNAME).trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || `${username}@admin.local`).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const role = (process.env.ADMIN_ROLE || 'SUPER_ADMIN').toUpperCase();
  const usingDefaultPassword = password === DEFAULT_PASSWORD;

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && usingDefaultPassword) {
    const message =
      '[admin] REFUSING to seed the administrator account with the default ' +
      'password in production. Set ADMIN_PASSWORD (and ideally ADMIN_USERNAME) ' +
      'in your environment, then redeploy.';
    console.error(message);
    return {
      created: false, updated: false, email, role,
      usingDefaultPassword, skipped: message,
    };
  }

  const existing = await query(
    `SELECT "id","role","passwordHash" FROM "User" WHERE LOWER("email") = $1`,
    [email]
  );

  if (existing.rows[0]) {
    const current = existing.rows[0];
    // Keep the role in step with configuration, but never silently reset a
    // password that an operator may have changed out of band.
    if (current.role !== role) {
      await query(
        `UPDATE "User" SET "role" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
        [current.id, role]
      );
      console.log(`[admin] Updated role for ${email} to ${role}.`);
      return { created: false, updated: true, email, role, usingDefaultPassword };
    }
    return { created: false, updated: false, email, role, usingDefaultPassword };
  }

  const passwordHash = await hashPassword(password);
  await query(
    `INSERT INTO "User" ("id","email","name","passwordHash","role","isBlocked")
     VALUES ($1,$2,$3,$4,$5,false)`,
    [crypto.randomUUID(), email, 'Store Administrator', passwordHash, role]
  );

  console.log(`[admin] Created administrator ${email} with role ${role}.`);
  if (usingDefaultPassword) {
    console.warn(
      `[admin] This account uses the default development password. ` +
      `Set ADMIN_PASSWORD before exposing the panel publicly.`
    );
  }

  return { created: true, updated: false, email, role, usingDefaultPassword };
}
