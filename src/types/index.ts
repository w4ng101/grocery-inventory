// ============================================================
// Core Domain Types - Grocery Inventory Management System
// ============================================================

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'staff' | 'viewer';
export type UnitType = 'kg' | 'g' | 'lb' | 'oz' | 'L' | 'mL' | 'pcs' | 'dozen' | 'box' | 'bag' | 'can' | 'bottle' | 'pack' | 'tray' | 'bunch';
export type AlertType = 'low_stock' | 'expiring_soon' | 'expired';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type SaleStatus = 'completed' | 'voided' | 'refunded';
export type ExpiryStatus = 'expired' | 'expiring_soon' | 'ok';

// ============================================================
// USER
// ============================================================
export interface User {
  id: string;
  auth_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  avatar_url?: string;
}

// ============================================================
// AUTH
// ============================================================
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  full_name: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// CATEGORY
// ============================================================
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ============================================================
// SUPPLIER
// ============================================================
export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ============================================================
// PRODUCT
// ============================================================
export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  supplier_id?: string;
  unit: UnitType;
  unit_size: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  image_url?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
  supplier?: Supplier;
}

export interface CreateProductDto {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  supplier_id?: string;
  unit: UnitType;
  unit_size: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold?: number;
  image_url?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  is_active?: boolean;
}

// ============================================================
// INVENTORY BATCH
// ============================================================
export interface InventoryBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  initial_qty: number;
  cost_price: number;
  manufactured_at?: string;
  expires_at?: string;
  received_at: string;
  received_by?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
}

export interface CreateBatchDto {
  product_id: string;
  quantity: number;
  cost_price: number;
  manufactured_at?: string;
  expires_at?: string;
  notes?: string;
}

// ============================================================
// INVENTORY SUMMARY (view)
// ============================================================
export interface InventorySummary {
  product_id: string;
  sku: string;
  name: string;
  unit: UnitType;
  unit_size: number;
  selling_price: number;
  cost_price: number;
  low_stock_threshold: number;
  category_name?: string;
  supplier_name?: string;
  total_quantity: number;
  batch_count: number;
  earliest_expiry?: string;
  is_active: boolean;
  is_low_stock?: boolean;
}

// ============================================================
// EXPIRING PRODUCT (view)
// ============================================================
export interface ExpiringProduct {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit: UnitType;
  quantity: number;
  expires_at: string;
  days_until_expiry: number;
  expiry_status: ExpiryStatus;
}

// ============================================================
// SALE
// ============================================================
export interface Sale {
  id: string;
  sale_number: string;
  sold_by?: string;
  total_amount: number;
  discount: number;
  tax: number;
  net_amount: number;
  status: SaleStatus;
  notes?: string;
  sold_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  seller?: User;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  batch_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Joined
  product?: Product;
}

export interface CreateSaleDto {
  notes?: string;
  discount?: number;
  tax?: number;
  items: CreateSaleItemDto[];
}

export interface CreateSaleItemDto {
  product_id: string;
  batch_id?: string;
  quantity: number;
  unit_price: number;
}

// ============================================================
// ALERTS
// ============================================================
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  product_id?: string;
  batch_id?: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  // Joined
  product?: Product;
}

// ============================================================
// ANALYTICS
// ============================================================
export interface DailyRevenue {
  sale_date: string;
  total_sales: number;
  total_revenue: number;
  total_items: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  unit: UnitType;
  total_qty: number;
  total_revenue: number;
  sale_count: number;
}

export interface SlowMovingProduct {
  product_id: string;
  product_name: string;
  unit: UnitType;
  total_stock: number;
  last_sold?: string;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_sales: number;
  total_products: number;
  low_stock_count: number;
  expiring_count: number;
  expired_count: number;
  revenue_change_pct: number;
  sales_change_pct: number;
}

// ============================================================
// API RESPONSE
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

// ============================================================
// RBAC PERMISSIONS
// ============================================================
export type Permission =
  | 'products:create' | 'products:read' | 'products:update' | 'products:delete'
  | 'inventory:create' | 'inventory:read' | 'inventory:update' | 'inventory:delete'
  | 'sales:create' | 'sales:read' | 'sales:update' | 'sales:delete'
  | 'analytics:read'
  | 'alerts:read' | 'alerts:resolve'
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'categories:create' | 'categories:read' | 'categories:update' | 'categories:delete'
  | 'suppliers:create' | 'suppliers:read' | 'suppliers:update' | 'suppliers:delete';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
    'sales:create', 'sales:read', 'sales:update', 'sales:delete',
    'analytics:read',
    'alerts:read', 'alerts:resolve',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
    'suppliers:create', 'suppliers:read', 'suppliers:update', 'suppliers:delete',
  ],
  admin: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
    'sales:create', 'sales:read', 'sales:update', 'sales:delete',
    'analytics:read',
    'alerts:read', 'alerts:resolve',
    'users:create', 'users:read', 'users:update',
    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
    'suppliers:create', 'suppliers:read', 'suppliers:update', 'suppliers:delete',
  ],
  manager: [
    'products:create', 'products:read', 'products:update',
    'inventory:create', 'inventory:read', 'inventory:update',
    'sales:create', 'sales:read', 'sales:update',
    'analytics:read',
    'alerts:read', 'alerts:resolve',
    'users:read',
    'categories:create', 'categories:read', 'categories:update',
    'suppliers:create', 'suppliers:read', 'suppliers:update',
  ],
  staff: [
    'products:read',
    'inventory:create', 'inventory:read',
    'sales:create', 'sales:read',
    'alerts:read',
    'categories:read',
    'suppliers:read',
  ],
  viewer: [
    'products:read',
    'inventory:read',
    'sales:read',
    'analytics:read',
    'alerts:read',
    'categories:read',
    'suppliers:read',
  ],
};
