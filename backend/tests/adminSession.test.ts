jest.mock('../src/models/Admin', () => ({
  Admin: { findById: jest.fn() },
  Role: { findById: jest.fn() }
}));

import jwt from 'jsonwebtoken';
import { Admin, Role } from '../src/models/Admin';
import { env } from '../src/config/env';
import { authenticateJwt } from '../src/middleware/auth.middleware';
import { ADMIN_SESSION_COOKIE, readCookie } from '../src/utils/adminSession';

describe('revocable admin session authentication', () => {
  const adminFindById = Admin.findById as jest.Mock;
  const roleFindById = Role.findById as jest.Mock;

  const createResponse = () => {
    const response: any = {};
    response.json = jest.fn(() => response);
    response.status = jest.fn(() => response);
    response.setHeader = jest.fn();
    return response;
  };

  const token = (sessionVersion: number, overrides: Record<string, any> = {}) => jwt.sign({
    id: 'admin-1',
    email: 'admin@example.com',
    type: 'admin',
    tokenUse: 'admin-session',
    roleId: 'role-1',
    sessionVersion,
    ...overrides
  }, env.JWT_SECRET, { expiresIn: '15m', issuer: 'kiyo-topup', audience: 'kiyo-admin' });

  beforeEach(() => jest.clearAllMocks());

  test('reads the exact HttpOnly session cookie value safely', () => {
    expect(readCookie(`other=1; ${ADMIN_SESSION_COOKIE}=abc.def.ghi; last=2`, ADMIN_SESSION_COOKIE)).toBe('abc.def.ghi');
    expect(readCookie('other=1', ADMIN_SESSION_COOKIE)).toBeNull();
  });

  test('accepts a current active admin session and reloads current permissions', async () => {
    adminFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => 'admin-1' },
        email: 'admin@example.com',
        status: 'active',
        roleId: { toString: () => 'role-1' },
        sessionVersion: 4
      })
    });
    roleFindById.mockReturnValue({ select: jest.fn().mockResolvedValue({ permissions: ['dashboard:read'] }) });
    const req: any = { headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token(4)}` } };
    const res = createResponse();
    const next = jest.fn();

    await authenticateJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.permissions).toEqual(['dashboard:read']);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store, max-age=0');
  });

  test('rejects a stale session immediately after revocation', async () => {
    adminFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => 'admin-1' },
        email: 'admin@example.com',
        status: 'active',
        roleId: { toString: () => 'role-1' },
        sessionVersion: 5
      })
    });
    const req: any = { headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token(4)}` } };
    const res = createResponse();
    const next = jest.fn();

    await authenticateJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(roleFindById).not.toHaveBeenCalled();
  });

  test('rejects legacy admin bearer tokens that lack the secure session claims', async () => {
    const legacyToken = jwt.sign({ id: 'admin-1', type: 'admin', permissions: ['*'] }, env.JWT_SECRET, { expiresIn: '7d' });
    const req: any = { headers: { authorization: `Bearer ${legacyToken}` } };
    const res = createResponse();
    const next = jest.fn();

    await authenticateJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(adminFindById).not.toHaveBeenCalled();
  });

  test('blocks cross-origin state changes that use the admin cookie', async () => {
    const req: any = {
      method: 'POST',
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${token(4)}`,
        origin: 'https://attacker.example',
        host: 'kiyotopup.vercel.app'
      },
      get(name: string) { return this.headers[name.toLowerCase()]; }
    };
    const res = createResponse();
    const next = jest.fn();

    await authenticateJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(adminFindById).not.toHaveBeenCalled();
  });
});
