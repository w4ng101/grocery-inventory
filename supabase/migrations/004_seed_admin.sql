-- Run this in Supabase SQL Editor to create the first superadmin account
-- Login: admin@groceryims.com / Admin@123456

INSERT INTO users (id, email, full_name, role, password_hash, is_active)
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
