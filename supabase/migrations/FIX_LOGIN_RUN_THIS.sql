-- ============================================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- This fixes login by adding password_hash + RPC functions + admin user
-- ============================================================

-- Step 1: Add password_hash column if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- Step 2: Create RPC function that bypasses RLS for login
CREATE OR REPLACE FUNCTION public.get_user_password_hash(p_email TEXT)
RETURNS TABLE (
  id            UUID,
  email         TEXT,
  full_name     TEXT,
  role          user_role,
  is_active     BOOLEAN,
  password_hash TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.role,
      u.is_active,
      u.password_hash
    FROM public.users u
    WHERE u.email = LOWER(TRIM(p_email))
      AND u.is_active = TRUE
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_password_hash(TEXT) TO anon, authenticated;

-- Step 3: Create update_last_login RPC
CREATE OR REPLACE FUNCTION public.update_last_login(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET last_login = NOW() WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_last_login(UUID) TO anon, authenticated;

-- Step 4: Insert/update admin user
-- Login: admin@groceryims.com / Admin@123456
INSERT INTO public.users (id, email, full_name, role, password_hash, is_active)
VALUES (
  gen_random_uuid(),
  'admin@groceryims.com',
  'Super Admin',
  'superadmin',
  '$2b$12$tfUkTxOfSBdkqhSKQmAgL.Beb6mtyNHz7Pm/8ocns/BLUBalkxhdO',
  true
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = '$2b$12$tfUkTxOfSBdkqhSKQmAgL.Beb6mtyNHz7Pm/8ocns/BLUBalkxhdO',
      is_active = true,
      role = 'superadmin';
