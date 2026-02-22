-- ============================================================
-- SETUP_MINIMAL.sql
-- Run this FIRST in Supabase Dashboard → SQL Editor → New Query
-- This creates only what is needed for login to work.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum: user_role (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'manager', 'staff', 'viewer');
  END IF;
END
$$;

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          public.user_role NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  avatar_url    TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS so service role key can read without policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Seed superadmin
-- Email   : admin@groceryims.com
-- Password: Admin@123456
INSERT INTO public.users (email, full_name, role, password_hash, is_active)
VALUES (
  'admin@groceryims.com',
  'Super Admin',
  'superadmin',
  '$2b$12$tfUkTxOfSBdkqhSKQmAgL.Beb6mtyNHz7Pm/8ocns/BLUBalkxhdO',
  true
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      is_active     = true,
      role          = 'superadmin';

-- Verify
SELECT id, email, full_name, role, is_active FROM public.users;
