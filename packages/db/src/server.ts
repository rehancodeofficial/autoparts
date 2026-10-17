// Load .env before anything reads process.env.
//
// Nothing in the server did this, so every value in .env — DATABASE_URL,
// SUPABASE_*, JWT_*, the payment and store settings — was silently ignored in
// local development, and the app ran only because db.ts falls back to a
// hardcoded localhost connection string. On Vercel there is no .env file and
// the platform injects the variables, where this call is a harmless no-op.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './apiRoutes';
import { runMigrations } from './db';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Safe __dirname polyfill — same rationale as db.ts:
// Vercel's esbuild compiles to CJS, where import.meta.url is undefined.
let _serverDir: string;
try {
  _serverDir = path.dirname(fileURLToPath(import.meta.url));
} catch {
  _serverDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
}

export function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  // Keep the untouched request bytes: payment webhook signatures are computed
  // over the exact body the provider sent, and re-serialising a parsed object
  // changes key order and whitespace, which breaks every HMAC check.
  app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString('utf8');
    },
  }));
  app.use(cookieParser());

  // Health check endpoint for Docker & Kubernetes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'autopart-api',
      timestamp: new Date().toISOString()
    });
  });

  // Authentication & Store APIs
  app.use('/api', apiRouter);

  // Serve compiled frontend production bundle if exists (local/Docker mode only)
  const distPath = path.join(_serverDir, '../../../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

export async function startServer(port: number = 4000) {
  try {
    console.log('Running PostgreSQL migrations...');
    await runMigrations().catch(e => {
      console.warn('Migration run notice (if standalone or testing):', e.message);
    });
    const { seedCatalogData } = await import('./catalogSeeder');
    await seedCatalogData().catch(e => {
      console.warn('Catalog seeder notice:', e.message);
    });
    // The admin panel cannot authenticate without a real administrator row.
    const { ensureAdminUser } = await import('./adminBootstrap');
    await ensureAdminUser().catch(e => {
      console.warn('Admin bootstrap notice:', e.message);
    });
  } catch (err) {
    console.error('Migration error:', err);
  }

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`AutoPart API Server running at http://localhost:${port}`);
  });

  return server;
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js') ||
  process.argv[1] === _serverDir + '/server.js'
);

const app = createApp();

if (isDirectRun || typeof require !== 'undefined' && require.main === module) {
  const port = parseInt(process.env.PORT || '4000', 10);
  startServer(port);
}

export default app;
