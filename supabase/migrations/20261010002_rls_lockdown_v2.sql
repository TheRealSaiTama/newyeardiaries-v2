-- RLS lockdown v2: drop EVERY policy by name-agnostic discovery, then rebuild.
--
-- Why v2 exists: 20261010001_lock_down_customer_pii.sql guessed policy names and
-- used DROP POLICY IF EXISTS, which silently no-ops when the real name differs.
-- Result after v1: orders, order_items and enquiries locked correctly, but
-- contact_submissions (7 rows) and quote_requests (7 rows) were STILL readable
-- with the public anon key. Verified live 2026-10-10.
--
-- Fix: enumerate pg_policies at runtime and drop whatever is there, instead of
-- matching on names we guessed. Then recreate the intended policy set.
--
-- Apply from Supabase dashboard -> SQL Editor -> Run.

-- ---------------------------------------------------------------------------
-- contact_submissions: public INSERT only. Everything else authenticated.
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'contact_submissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_submissions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "nyd_public_insert_contact_submissions"
  ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "nyd_admin_select_contact_submissions"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nyd_admin_update_contact_submissions"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "nyd_admin_delete_contact_submissions"
  ON public.contact_submissions FOR DELETE TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- quote_requests: public INSERT only.
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'quote_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quote_requests', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "nyd_public_insert_quote_requests"
  ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "nyd_admin_select_quote_requests"
  ON public.quote_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nyd_admin_update_quote_requests"
  ON public.quote_requests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "nyd_admin_delete_quote_requests"
  ON public.quote_requests FOR DELETE TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- enquiries: public INSERT only.
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'enquiries'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.enquiries', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "nyd_public_insert_enquiries"
  ON public.enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "nyd_admin_select_enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nyd_admin_update_enquiries"
  ON public.enquiries FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- orders: public INSERT only. Re-assert in case v1 left a permissive policy.
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'orders'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "nyd_public_insert_orders"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "nyd_admin_select_orders"
  ON public.orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nyd_admin_update_orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "nyd_admin_delete_orders"
  ON public.orders FOR DELETE TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Clean up the verification probe row inserted by the anon role during the
-- post-migration test on 2026-10-10.
-- ---------------------------------------------------------------------------
DELETE FROM public.contact_submissions WHERE email = 'verify-probe@example.invalid';

-- ---------------------------------------------------------------------------
-- Proof: this result set is what is enforced now. anon should appear only in
-- the INSERT policies.
-- ---------------------------------------------------------------------------
SELECT tablename,
       policyname,
       cmd,
       roles::text AS applies_to_roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contact_submissions','quote_requests','enquiries','orders','order_items')
ORDER BY tablename, cmd, policyname;