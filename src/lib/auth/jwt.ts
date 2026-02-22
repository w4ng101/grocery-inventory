import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import type { JwtPayload, AuthTokens } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'GroceryIMS_S3cur3_JWT_K3y_2026_xZ9mNpQrWvBhDkLs';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

// Parse duration string like '8h', '7d' into seconds
function parseDuration(d: string): number {
  const num = parseInt(d);
  if (d.endsWith('h')) return num * 3600;
  if (d.endsWith('d')) return num * 86400;
  if (d.endsWith('m')) return num * 60;
  return num;
}

export async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresIn = parseDuration(JWT_EXPIRES_IN);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .setIssuer('grocery-ims')
    .setAudience('grocery-ims-client')
    .sign(getSecretKey());
}

export async function signRefreshToken(sub: string): Promise<string> {
  const expiresIn = parseDuration(REFRESH_EXPIRES_IN);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ['HS256'],
    issuer: 'grocery-ims',
    audience: 'grocery-ims-client',
  });
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; type: string }> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ['HS256'],
  });
  return payload as unknown as { sub: string; type: string };
}

export async function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload.sub),
  ]);
  const expiresIn = parseDuration(JWT_EXPIRES_IN);
  return { accessToken, refreshToken, expiresIn };
}

export function extractTokenFromHeader(header: string | null): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}
