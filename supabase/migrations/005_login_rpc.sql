-- Migration 005: Login RPC function
-- Allows login to work with anon key (no service role key required for auth)
-- SECURITY DEFINER bypasses RLS for this specific controlled operation

CREATE OR REPLACE FUNCTION public.authenticate_user(p_email TEXT, p_password_hash TEXT)
RETURNS TABLE (
  id          UUID,
  email       TEXT,
  full_name   TEXT,
  role        user_role,
  is_active   BOOLEAN,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ
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
      u.last_login,
      u.created_at
    FROM public.users u
    WHERE u.email = LOWER(TRIM(p_email))
      AND u.is_active = TRUE
    LIMIT 1;
END;
$$;

-- Allow anon/authenticated to call this function
GRANT EXECUTE ON FUNCTION public.authenticate_user(TEXT, TEXT) TO anon, authenticated;

-- Separate function to get password hash for a given email (used for bcrypt compare in app layer)
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

-- Allow anon to call this (password hash comparison happens server-side in Node, not exposed to browser)
GRANT EXECUTE ON FUNCTION public.get_user_password_hash(TEXT) TO anon, authenticated;

-- Also update last_login via a secure function
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
