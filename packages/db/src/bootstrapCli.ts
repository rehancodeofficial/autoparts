/**
 * One-shot bootstrap: apply migrations, seed the catalogue and ensure the
 * administrator account exists. Run against any DATABASE_URL.
 *
 *   pnpm db:bootstrap
 *
 * Useful for a fresh Supabase project, where the serverless API never runs
 * the start-up path that would otherwise do this.
 */
import 'dotenv/config';
import { runMigrations, closeDatabase } from './db';
import { ensureAdminUser } from './adminBootstrap';

async function main() {
  const target = (process.env.DATABASE_URL || '').replace(/:[^:@/]*@/, ':***@');
  console.log(`Bootstrapping ${target || '(no DATABASE_URL set)'}`);

  console.log('→ Applying migrations…');
  await runMigrations();

  console.log('→ Seeding catalogue…');
  const { seedCatalogData } = await import('./catalogSeeder');
  await seedCatalogData();

  console.log('→ Ensuring administrator account…');
  const admin = await ensureAdminUser();
  if (admin.skipped) {
    console.log(`   skipped: ${admin.skipped}`);
  } else {
    console.log(`   ${admin.email} (${admin.role})${admin.created ? ' created' : ' already present'}`);
  }

  console.log('Done.');
}

main()
  .catch(err => {
    console.error('Bootstrap failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
