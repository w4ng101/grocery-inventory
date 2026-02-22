/**
 * Input sanitization & validation utilities (VAPT)
 * Prevents XSS, SQL injection, and other injection attacks
 */

// Strip dangerous HTML tags and attributes
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Escape special SQL chars (defense-in-depth; parameterized queries are primary)
export function escapeSql(input: string): string {
  return input.replace(/'/g, "''").replace(/--/g, '').replace(/;/g, '');
}

// Strip null bytes and control characters
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/[\x01-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 5000); // max length
}

// Validate UUID format
export function isValidUuid(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

// Validate positive number
export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && isFinite(value) && value >= 0;
}

// Sanitize object recursively (shallow)
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(val);
    } else {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

// Parse safe integer from query param
export function parseSafeInt(value: string | null | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(0, Math.min(parsed, 1000000));
}

// Extract safe pagination params
export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    page: parseSafeInt(searchParams.get('page'), 1),
    limit: Math.min(parseSafeInt(searchParams.get('limit'), 20), 100),
    search: sanitizeString(searchParams.get('search') ?? ''),
    sort_by: sanitizeString(searchParams.get('sort_by') ?? 'created_at'),
    sort_order: (searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  };
}
