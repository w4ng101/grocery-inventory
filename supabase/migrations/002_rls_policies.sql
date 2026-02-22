-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if current user is admin+
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin');
$$ LANGUAGE sql STABLE;

-- Helper function to check if current user is manager+
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin', 'manager');
$$ LANGUAGE sql STABLE;

-- ============================================================
-- USERS POLICIES
-- ============================================================
-- All authenticated users can read users
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only superadmin/admin can insert/update/delete users
CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT WITH CHECK (is_admin_or_above());

CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (is_admin_or_above() OR auth_id = auth.uid());

CREATE POLICY "users_delete_superadmin" ON public.users
  FOR DELETE USING (get_user_role() = 'superadmin');

-- ============================================================
-- CATEGORIES POLICIES
-- ============================================================
CREATE POLICY "categories_select_auth" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "categories_write_manager" ON public.categories
  FOR ALL USING (is_manager_or_above());

-- ============================================================
-- SUPPLIERS POLICIES
-- ============================================================
CREATE POLICY "suppliers_select_auth" ON public.suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "suppliers_write_manager" ON public.suppliers
  FOR ALL USING (is_manager_or_above());

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================
CREATE POLICY "products_select_auth" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "products_insert_manager" ON public.products
  FOR INSERT WITH CHECK (is_manager_or_above());

CREATE POLICY "products_update_manager" ON public.products
  FOR UPDATE USING (is_manager_or_above());

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (is_admin_or_above());

-- ============================================================
-- INVENTORY BATCHES POLICIES
-- ============================================================
CREATE POLICY "batches_select_auth" ON public.inventory_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "batches_insert_staff" ON public.inventory_batches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "batches_update_manager" ON public.inventory_batches
  FOR UPDATE USING (is_manager_or_above());

CREATE POLICY "batches_delete_admin" ON public.inventory_batches
  FOR DELETE USING (is_admin_or_above());

-- ============================================================
-- SALES POLICIES
-- ============================================================
CREATE POLICY "sales_select_auth" ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sales_insert_staff" ON public.sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sales_update_manager" ON public.sales
  FOR UPDATE USING (is_manager_or_above());

CREATE POLICY "sales_delete_admin" ON public.sales
  FOR DELETE USING (is_admin_or_above());

-- ============================================================
-- SALE ITEMS POLICIES
-- ============================================================
CREATE POLICY "sale_items_select_auth" ON public.sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sale_items_insert_staff" ON public.sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- ALERTS POLICIES
-- ============================================================
CREATE POLICY "alerts_select_auth" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "alerts_write_system" ON public.alerts
  FOR ALL USING (is_manager_or_above());

-- ============================================================
-- AUDIT LOGS POLICIES (read-only for non-superadmin)
-- ============================================================
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (is_admin_or_above());

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- Inserted by server-side service role
