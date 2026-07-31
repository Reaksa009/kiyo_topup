import { CookieOptions } from 'express';
import { env } from '../config/env';

export const ADMIN_SESSION_COOKIE = 'kiyo_admin_session';
export const ADMIN_SESSION_TTL_MS = 15 * 60 * 1000;

export const adminSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: env.API_PREFIX,
  maxAge: ADMIN_SESSION_TTL_MS
});

export const adminSessionClearOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: env.API_PREFIX
});

export const readCookie = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
};
