-- ============================================================
-- SETUP_COMPLETE.sql
-- Grocery Inventory Management System – Full Database Setup
-- ============================================================

-- ============================================================
-- STEP 1 – Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STEP 2 – Enum Types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'manager', 'staff', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.unit_type AS ENUM ('kg', 'g', 'lb', 'oz', 'L', 'mL', 'pcs', 'dozen', 'box', 'bag', 'can', 'bottle', 'pack', 'tray', 'bunch');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_type AS ENUM ('low_stock', 'expiring_soon', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sale_status AS ENUM ('completed', 'voided', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 3 – Tables
-- ============================================================

-- USERS (already created by SETUP_MINIMAL, safe to re-run)
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

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  icon        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku                 TEXT NOT NULL UNIQUE,
  barcode             TEXT UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id         UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit                public.unit_type NOT NULL DEFAULT 'pcs',
  unit_size           NUMERIC(10,3) NOT NULL DEFAULT 1,
  cost_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  image_url           TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES public.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVENTORY BATCHES
CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number  TEXT NOT NULL UNIQUE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_price    NUMERIC(12,2),
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    DATE,
  supplier_id   UUID REFERENCES public.suppliers(id),
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number  TEXT NOT NULL UNIQUE,
  status       public.sale_status NOT NULL DEFAULT 'completed',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  sold_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_by      UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id     UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id),
  batch_id    UUID REFERENCES public.inventory_batches(id),
  quantity    NUMERIC(12,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        public.alert_type NOT NULL,
  severity    public.alert_severity NOT NULL DEFAULT 'warning',
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id    UUID REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.users(id),
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id  UUID,
  old_data   JSONB,
  new_data   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STEP 4 – Views
-- ============================================================
CREATE OR REPLACE VIEW public.inventory_summary AS
SELECT
  p.id            AS product_id,
  p.sku,
  p.name          AS product_name,
  p.unit,
  p.unit_size,
  p.selling_price,
  p.cost_price,
  p.low_stock_threshold,
  c.name          AS category_name,
  s.name          AS supplier_name,
  COALESCE(SUM(ib.quantity), 0)::NUMERIC(12,3) AS total_quantity,
  COUNT(ib.id)    AS batch_count,
  MIN(ib.expires_at) AS earliest_expiry,
  p.is_active
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.suppliers s ON s.id = p.supplier_id
LEFT JOIN public.inventory_batches ib
  ON ib.product_id = p.id AND ib.is_active = true AND ib.quantity > 0
GROUP BY p.id, p.sku, p.name, p.unit, p.unit_size,
         p.selling_price, p.cost_price, p.low_stock_threshold,
         c.name, s.name, p.is_active;

CREATE OR REPLACE VIEW public.expiring_products AS
SELECT
  ib.id            AS batch_id,
  ib.batch_number,
  ib.product_id,
  p.name           AS product_name,
  p.sku,
  p.unit,
  ib.quantity,
  ib.expires_at,
  (ib.expires_at - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN ib.expires_at < CURRENT_DATE THEN 'expired'
    WHEN ib.expires_at <= CURRENT_DATE + 7 THEN 'expiring_soon'
    ELSE 'ok'
  END AS expiry_status
FROM public.inventory_batches ib
JOIN public.products p ON p.id = ib.product_id
WHERE ib.is_active = true AND ib.quantity > 0
ORDER BY ib.expires_at ASC;

-- ============================================================
-- STEP 5 – Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier  ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku       ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_batches_product    ON public.inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expires    ON public.inventory_batches(expires_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at      ON public.sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type        ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_product     ON public.alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table   ON public.audit_logs(table_name);

-- ============================================================
-- STEP 6 – updated_at Trigger Function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at      ON public.users;
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS trg_suppliers_updated_at  ON public.suppliers;
DROP TRIGGER IF EXISTS trg_products_updated_at   ON public.products;
DROP TRIGGER IF EXISTS trg_batches_updated_at    ON public.inventory_batches;
DROP TRIGGER IF EXISTS trg_sales_updated_at      ON public.sales;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON public.inventory_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 7 – Stock Deduction Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE public.inventory_batches
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.batch_id AND quantity >= NEW.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock in batch %', NEW.batch_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_stock ON public.sale_items;
CREATE TRIGGER trg_deduct_stock
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_sale();

-- ============================================================
-- STEP 8 – RLS
-- ============================================================
ALTER TABLE public.users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- Helper role functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('superadmin', 'admin');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('superadmin', 'admin', 'manager');
$$ LANGUAGE sql STABLE;

-- CATEGORIES policies
DROP POLICY IF EXISTS "categories_select_auth"   ON public.categories;
DROP POLICY IF EXISTS "categories_write_manager" ON public.categories;
CREATE POLICY "categories_select_auth"   ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_write_manager" ON public.categories FOR ALL    USING (true);

-- SUPPLIERS policies
DROP POLICY IF EXISTS "suppliers_select_auth"   ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_write_manager" ON public.suppliers;
CREATE POLICY "suppliers_select_auth"   ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "suppliers_write_manager" ON public.suppliers FOR ALL    USING (true);

-- PRODUCTS policies
DROP POLICY IF EXISTS "products_select_auth"   ON public.products;
DROP POLICY IF EXISTS "products_write_manager" ON public.products;
CREATE POLICY "products_select_auth"   ON public.products FOR SELECT USING (true);
CREATE POLICY "products_write_manager" ON public.products FOR ALL    USING (true);

-- INVENTORY BATCHES policies
DROP POLICY IF EXISTS "batches_select_auth"   ON public.inventory_batches;
DROP POLICY IF EXISTS "batches_write_manager" ON public.inventory_batches;
CREATE POLICY "batches_select_auth"   ON public.inventory_batches FOR SELECT USING (true);
CREATE POLICY "batches_write_manager" ON public.inventory_batches FOR ALL    USING (true);

-- SALES policies
DROP POLICY IF EXISTS "sales_select_auth"   ON public.sales;
DROP POLICY IF EXISTS "sales_write_staff"   ON public.sales;
CREATE POLICY "sales_select_auth"  ON public.sales FOR SELECT USING (true);
CREATE POLICY "sales_write_staff"  ON public.sales FOR ALL    USING (true);

-- SALE ITEMS policies
DROP POLICY IF EXISTS "sale_items_select_auth"  ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_write_staff"  ON public.sale_items;
CREATE POLICY "sale_items_select_auth" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "sale_items_write_staff" ON public.sale_items FOR ALL    USING (true);

-- ALERTS policies
DROP POLICY IF EXISTS "alerts_select_auth"  ON public.alerts;
DROP POLICY IF EXISTS "alerts_write_system" ON public.alerts;
CREATE POLICY "alerts_select_auth"  ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts_write_system" ON public.alerts FOR ALL    USING (true);

-- AUDIT LOGS policies
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert_all"   ON public.audit_logs;
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_insert_all"   ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ============================================================
-- STEP 9 – Number Generator Functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 10 – Analytics Functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_expiry_alerts()
RETURNS INTEGER AS $$
DECLARE
  inserted INTEGER := 0;
BEGIN
  INSERT INTO public.alerts (type, severity, product_id, batch_id, message)
  SELECT
    CASE WHEN ib.expires_at < CURRENT_DATE THEN 'expired'::public.alert_type ELSE 'expiring_soon'::public.alert_type END,
    CASE WHEN ib.expires_at < CURRENT_DATE THEN 'critical'::public.alert_severity ELSE 'warning'::public.alert_severity END,
    ib.product_id,
    ib.id,
    CASE
      WHEN ib.expires_at < CURRENT_DATE THEN p.name || ' batch ' || ib.batch_number || ' has expired'
      ELSE p.name || ' batch ' || ib.batch_number || ' expires in ' || (ib.expires_at - CURRENT_DATE) || ' days'
    END
  FROM public.inventory_batches ib
  JOIN public.products p ON p.id = ib.product_id
  WHERE ib.is_active = true
    AND ib.quantity > 0
    AND ib.expires_at IS NOT NULL
    AND ib.expires_at <= CURRENT_DATE + 7
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.batch_id = ib.id AND a.is_read = false
        AND a.type IN ('expired', 'expiring_soon')
    );
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_daily_revenue(p_days INTEGER DEFAULT 30)
RETURNS TABLE (sale_date DATE, revenue NUMERIC, order_count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT
      DATE(s.sold_at) AS sale_date,
      SUM(s.total_amount) AS revenue,
      COUNT(*) AS order_count
    FROM public.sales s
    WHERE s.status = 'completed'
      AND s.sold_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(s.sold_at)
    ORDER BY sale_date DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_top_products(p_limit INTEGER DEFAULT 10, p_days INTEGER DEFAULT 30)
RETURNS TABLE (product_id UUID, product_name TEXT, total_sold NUMERIC, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.name,
      SUM(si.quantity) AS total_sold,
      SUM(si.total_price) AS revenue
    FROM public.sale_items si
    JOIN public.products p ON p.id = si.product_id
    JOIN public.sales s ON s.id = si.sale_id
    WHERE s.status = 'completed'
      AND s.sold_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_slow_moving_products(p_days INTEGER DEFAULT 30)
RETURNS TABLE (product_id UUID, product_name TEXT, unit public.unit_type, total_quantity NUMERIC, last_sold TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.unit,
      COALESCE(SUM(ib.quantity), 0) AS total_quantity,
      MAX(s.sold_at) AS last_sold
    FROM public.products p
    LEFT JOIN public.inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true AND ib.quantity > 0
    LEFT JOIN public.sale_items si ON si.product_id = p.id
    LEFT JOIN public.sales s ON s.id = si.sale_id AND s.status = 'completed'
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.unit
    HAVING COALESCE(MAX(s.sold_at), '1970-01-01') < NOW() - (p_days || ' days')::INTERVAL
    ORDER BY last_sold ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 11 – Login RPCs (SECURITY DEFINER – bypass RLS for auth)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_password_hash(p_email TEXT)
RETURNS TABLE (
  id            UUID,
  email         TEXT,
  full_name     TEXT,
  role          public.user_role,
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

-- ============================================================
-- STEP 12 – Seed Default Categories
-- ============================================================
INSERT INTO public.categories (name, description, color) VALUES
  ('Fruits & Vegetables', 'Fresh produce', '#22c55e'),
  ('Dairy & Eggs',        'Milk, cheese, eggs', '#f59e0b'),
  ('Meat & Seafood',      'Fresh and frozen meats', '#ef4444'),
  ('Bakery',              'Bread, pastries', '#f97316'),
  ('Beverages',           'Drinks and juices', '#3b82f6'),
  ('Snacks & Confectionery', 'Chips, sweets, chocolate', '#a855f7'),
  ('Frozen Foods',        'Frozen meals and vegetables', '#06b6d4'),
  ('Canned & Packaged',   'Tinned and packaged goods', '#84cc16'),
  ('Cleaning & Household','Detergents and cleaning products', '#64748b'),
  ('Personal Care',       'Hygiene and beauty products', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STEP 13 – Seed superadmin (idempotent)
-- Email   : admin@groceryims.com
-- Password: Admin@123456
-- ============================================================
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
