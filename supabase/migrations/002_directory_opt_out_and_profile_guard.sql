-- 002: Directory opt-out + protect privileged profile columns
-- Run once in the Supabase SQL editor (safe to re-run).

-- 1. Directory opt-out. Members are listed by default and can hide themselves
--    from "Find old friends" on their Edit profile page.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_directory
  ON public.profiles (show_in_directory, status, is_active);

-- 2. Members may update their own profile row (policy "Users can update own profile"),
--    but that policy covers every column. Without this guard a member could call the
--    Supabase API with their own token and set role = 'admin', or mark themselves active.
--    Only the server (service role) may change these columns.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.membership_number IS DISTINCT FROM OLD.membership_number
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Not allowed to change protected profile fields'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 3. Check: is row-level security switched on for the tables the site uses?
--    Every row should say rls_enabled = true. If any say false, anyone holding the
--    public anon key can read that table directly; tell the developer before launch.
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('profiles', 'payments', 'orders', 'memberships', 'events',
                  'event_registrations', 'contact_messages', 'products', 'product_variants')
ORDER BY relname;
