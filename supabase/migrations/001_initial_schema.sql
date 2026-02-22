-- ============================================================
-- Migration 001: Initial Schema
-- Grocery Inventory Management System
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'manager', 'staff', 'viewer');
CREATE TYPE unit_type AS ENUM ('kg', 'g', 'lb', 'oz', 'L', 'mL', 'pcs', 'dozen', 'box', 'bag', 'can', 'bottle', 'pack', 'tray', 'bunch');
CREATE TYPE alert_type AS ENUM ('low_stock', 'expiring_soon', 'expired');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE sale_status AS ENUM ('completed', 'voided', 'refunded');

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  full_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL DEFAULT '',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  avatar_url   TEXT,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  icon        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================
CREATE TABLE public.suppliers (
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

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku                 TEXT NOT NULL UNIQUE,
  barcode             TEXT UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id         UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit                unit_type NOT NULL DEFAULT 'pcs',
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

-- ============================================================
-- INVENTORY / BATCHES TABLE
-- ============================================================
CREATE TABLE public.inventory_batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number    TEXT NOT NULL,
  quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,
  initial_qty     NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  manufactured_at DATE,
  expires_at      DATE,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by     UUID REFERENCES public.users(id),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, batch_number)
);

-- ============================================================
-- INVENTORY VIEW (total stock per product)
-- ============================================================
CREATE VIEW public.inventory_summary AS
SELECT
  p.id               AS product_id,
  p.sku,
  p.name,
  p.unit,
  p.unit_size,
  p.selling_price,
  p.cost_price,
  p.low_stock_threshold,
  c.name             AS category_name,
  s.name             AS supplier_name,
  COALESCE(SUM(ib.quantity), 0)   AS total_quantity,
  COUNT(ib.id)                     AS batch_count,
  MIN(ib.expires_at)               AS earliest_expiry,
  p.is_active
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.suppliers s ON s.id = p.supplier_id
LEFT JOIN public.inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true AND ib.quantity > 0
GROUP BY p.id, p.sku, p.name, p.unit, p.unit_size, p.selling_price, p.cost_price, p.low_stock_threshold, c.name, s.name, p.is_active;

-- ============================================================
-- SALES TABLE
-- ============================================================
CREATE TABLE public.sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number     TEXT NOT NULL UNIQUE,
  sold_by         UUID REFERENCES public.users(id),
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          sale_status NOT NULL DEFAULT 'completed',
  notes           TEXT,
  sold_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALE ITEMS TABLE
-- ============================================================
CREATE TABLE public.sale_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id       UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id),
  batch_id      UUID REFERENCES public.inventory_batches(id),
  quantity      NUMERIC(12,3) NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal      NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ALERTS TABLE
-- ============================================================
CREATE TABLE public.alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          alert_type NOT NULL,
  severity      alert_severity NOT NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id      UUID REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  is_resolved   BOOLEAN NOT NULL DEFAULT false,
  resolved_by   UUID REFERENCES public.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE (VAPT compliance)
-- ============================================================
CREATE TABLE public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.users(id),
  action       TEXT NOT NULL,
  table_name   TEXT NOT NULL,
  record_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_batches_product ON public.inventory_batches(product_id);
CREATE INDEX idx_batches_expires ON public.inventory_batches(expires_at);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX idx_sales_sold_at ON public.sales(sold_at);
CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_product ON public.alerts(product_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.inventory_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-DEDUCT STOCK TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE public.inventory_batches
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.batch_id AND quantity >= NEW.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock in batch %', NEW.batch_id;
    END IF;
  ELSE
    -- Deduct from oldest batch (FIFO)
    WITH ranked AS (
      SELECT id, quantity,
             SUM(quantity) OVER (ORDER BY received_at ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
      FROM public.inventory_batches
      WHERE product_id = (SELECT product_id FROM public.sale_items WHERE id = NEW.id LIMIT 1)
        AND quantity > 0 AND is_active = true
    )
    UPDATE public.inventory_batches ib
    SET quantity = CASE
      WHEN ranked.running_total - ib.quantity >= NEW.quantity THEN ib.quantity
      WHEN ranked.running_total >= NEW.quantity THEN ranked.running_total - NEW.quantity
      ELSE 0
    END
    FROM ranked WHERE ib.id = ranked.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_stock AFTER INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_sale();
