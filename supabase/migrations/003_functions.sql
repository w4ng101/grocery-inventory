-- ============================================================
-- Migration 003: Database Functions & Analytics
-- ============================================================

-- ============================================================
-- GENERATE SALE NUMBER
-- ============================================================
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  v_date  TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_seq   INTEGER;
  v_num   TEXT;
BEGIN
  SELECT COUNT(*) + 1
  INTO v_seq
  FROM public.sales
  WHERE DATE(sold_at) = CURRENT_DATE;

  v_num := 'SALE-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GENERATE BATCH NUMBER
-- ============================================================
CREATE OR REPLACE FUNCTION generate_batch_number(p_product_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_date  TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_seq   INTEGER;
BEGIN
  SELECT COUNT(*) + 1
  INTO v_seq
  FROM public.inventory_batches
  WHERE product_id = p_product_id;

  RETURN 'BATCH-' || v_date || '-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GENERATE ALERTS (called by cron or trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_expiry_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- Expired alerts
  FOR rec IN
    SELECT ib.id AS batch_id, ib.product_id, p.name AS product_name,
           ib.batch_number, ib.expires_at, ib.quantity
    FROM public.inventory_batches ib
    JOIN public.products p ON p.id = ib.product_id
    WHERE ib.expires_at < CURRENT_DATE
      AND ib.quantity > 0
      AND ib.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.batch_id = ib.id AND a.type = 'expired' AND a.is_resolved = false
      )
  LOOP
    INSERT INTO public.alerts (type, severity, product_id, batch_id, message)
    VALUES (
      'expired', 'critical', rec.product_id, rec.batch_id,
      format('EXPIRED: %s (Batch %s) expired on %s. %s units remaining.',
        rec.product_name, rec.batch_number, rec.expires_at, rec.quantity)
    );
    v_count := v_count + 1;
  END LOOP;

  -- Expiring soon (within 7 days)
  FOR rec IN
    SELECT ib.id AS batch_id, ib.product_id, p.name AS product_name,
           ib.batch_number, ib.expires_at, ib.quantity
    FROM public.inventory_batches ib
    JOIN public.products p ON p.id = ib.product_id
    WHERE ib.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND ib.quantity > 0
      AND ib.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.batch_id = ib.id AND a.type = 'expiring_soon' AND a.is_resolved = false
      )
  LOOP
    INSERT INTO public.alerts (type, severity, product_id, batch_id, message)
    VALUES (
      'expiring_soon', 'warning', rec.product_id, rec.batch_id,
      format('EXPIRING SOON: %s (Batch %s) expires on %s. %s units remaining.',
        rec.product_name, rec.batch_number, rec.expires_at, rec.quantity)
    );
    v_count := v_count + 1;
  END LOOP;

  -- Low stock alerts
  FOR rec IN
    SELECT p.id AS product_id, p.name AS product_name,
           p.low_stock_threshold, COALESCE(SUM(ib.quantity), 0) AS total_qty
    FROM public.products p
    LEFT JOIN public.inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true AND ib.quantity > 0
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.low_stock_threshold
    HAVING COALESCE(SUM(ib.quantity), 0) <= p.low_stock_threshold
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.product_id = p.id AND a.type = 'low_stock' AND a.is_resolved = false
      )
  LOOP
    INSERT INTO public.alerts (type, severity, product_id, batch_id, message)
    VALUES (
      'low_stock', 'warning', rec.product_id, NULL,
      format('LOW STOCK: %s has only %s units remaining (threshold: %s).',
        rec.product_name, rec.total_qty, rec.low_stock_threshold)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ANALYTICS: DAILY REVENUE
-- ============================================================
CREATE OR REPLACE FUNCTION get_daily_revenue(
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(sale_date DATE, total_sales BIGINT, total_revenue NUMERIC, total_items NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(s.sold_at) AS sale_date,
    COUNT(DISTINCT s.id) AS total_sales,
    SUM(s.net_amount)    AS total_revenue,
    SUM(si.quantity)     AS total_items
  FROM public.sales s
  LEFT JOIN public.sale_items si ON si.sale_id = s.id
  WHERE s.status = 'completed'
    AND DATE(s.sold_at) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(s.sold_at)
  ORDER BY sale_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ANALYTICS: TOP SELLING PRODUCTS
-- ============================================================
CREATE OR REPLACE FUNCTION get_top_products(
  p_limit      INTEGER DEFAULT 10,
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  product_id   UUID,
  product_name TEXT,
  unit         unit_type,
  total_qty    NUMERIC,
  total_revenue NUMERIC,
  sale_count   BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.unit,
    SUM(si.quantity)    AS total_qty,
    SUM(si.subtotal)    AS total_revenue,
    COUNT(DISTINCT si.sale_id) AS sale_count
  FROM public.sale_items si
  JOIN public.products p ON p.id = si.product_id
  JOIN public.sales s ON s.id = si.sale_id
  WHERE s.status = 'completed'
    AND DATE(s.sold_at) BETWEEN p_start_date AND p_end_date
  GROUP BY p.id, p.name, p.unit
  ORDER BY total_qty DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ANALYTICS: SLOW MOVING ITEMS (not sold in X days)
-- ============================================================
CREATE OR REPLACE FUNCTION get_slow_moving_products(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  product_id   UUID,
  product_name TEXT,
  unit         unit_type,
  total_stock  NUMERIC,
  last_sold    TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.unit,
    COALESCE(SUM(ib.quantity), 0) AS total_stock,
    MAX(s.sold_at) AS last_sold
  FROM public.products p
  LEFT JOIN public.inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
  LEFT JOIN public.sale_items si ON si.product_id = p.id
  LEFT JOIN public.sales s ON s.id = si.sale_id AND s.status = 'completed'
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.unit
  HAVING COALESCE(MAX(s.sold_at), '1970-01-01') < NOW() - (p_days || ' days')::INTERVAL
  ORDER BY last_sold ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EXPIRING PRODUCTS VIEW
-- ============================================================
CREATE VIEW public.expiring_products AS
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
