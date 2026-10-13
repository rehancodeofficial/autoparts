import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './apiRoutes';
import { runMigrations } from './db';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
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

  // Serve compiled frontend production bundle if exists
  const distPath = path.join(__dirname, '../../../dist');
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
  process.argv[1] === __filename
);

if (isDirectRun || typeof require !== 'undefined' && require.main === module) {
  const port = parseInt(process.env.PORT || '4000', 10);
  startServer(port);
}
