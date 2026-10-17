-- ============================================================================
-- AutoParts KSA — Row Level Security lockdown
--
-- Every read and write in this application goes through the Express API, which
-- connects as the database owner (Supabase `postgres` role via the pooler) and
-- therefore bypasses RLS. The browser never talks to PostgREST directly — the
-- anon key in VITE_SUPABASE_ANON_KEY is unused by application code.
--
-- So the correct posture is deny-all: enable RLS on every table and create no
-- policies for `anon` or `authenticated`. With RLS on and no matching policy,
-- PostgREST returns zero rows and rejects every write. If the anon key ever
-- leaks, customer orders, payments and admin data stay unreachable.
--
-- Portable: the role GRANT/REVOKE statements are skipped when the Supabase
-- roles are absent (local PostgreSQL, pg-mem test harness).
-- ============================================================================

DO $rls$
DECLARE
    t text;
    tables text[] := ARRAY[
        'User', 'Address', 'Session', 'RefreshToken', 'AuditLog',
        'Cart', 'CartItem',
        'Order', 'OrderItem', 'OrderEvent',
        'Payment', 'Refund', 'WebhookEvent',
        'Discount', 'DiscountRedemption',
        'InventoryMovement',
        'VehicleMake', 'VehicleModel', 'VehicleYear', 'VehicleVariant',
        'PartBrand', 'Category', 'CategoryAttribute', 'QualityGradeConfig',
        'Product', 'ProductImage', 'ProductFitment', 'PartNumber'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END
$rls$;

-- Strip table privileges from the public API roles as a second layer of
-- defence, so a future policy mistake cannot expose data on its own.
DO $revoke$
DECLARE
    r text;
BEGIN
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format(
                'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
            EXECUTE format(
                'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
        END IF;
    END LOOP;
END
$revoke$;
