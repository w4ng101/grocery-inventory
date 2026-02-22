-- Migration 006: Add password_hash to users table
-- Run this if you already ran 001_initial_schema.sql

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
