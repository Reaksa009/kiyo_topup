jest.mock('../src/models/Admin', () => ({
  Admin: { findOne: jest.fn(), findByIdAndUpdate: jest.fn() },
  Role: { findById: jest.fn() }
}));
jest.mock('../src/models/User', () => ({ User: {} }));
jest.mock('../src/services/audit.service', () => ({ AuditService: { log: jest.fn() } }));
jest.mock('mongoose', () => ({
  __esModule: true,
  default: { connection: { readyState: 1 } }
}));

import bcrypt from 'bcryptjs';
import { Admin, Role } from '../src/models/Admin';
import { AuditService } from '../src/services/audit.service';
import { AuthController } from '../src/controllers/auth.controller';
import { ADMIN_SESSION_COOKIE } from '../src/utils/adminSession';

describe('admin login hardening', () => {
  const adminFindOne = Admin.findOne as jest.Mock;
  const roleFindById = Role.findById as jest.Mock;
  const auditLog = AuditService.log as jest.Mock;

  const response = () => {
    const res: any = {};
    res.json = jest.fn(() => res);
    res.status = jest.fn(() => res);
    res.cookie = jest.fn(() => res);
    res.setHeader = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('locks an account for 15 minutes on the fifth failed password', async () => {
    const admin: any = {
      _id: { toString: () => 'admin-1' },
      status: 'active',
      passwordHash: 'real-hash',
      failedLoginAttempts: 4,
      lockedUntil: undefined,
      save: jest.fn().mockResolvedValue(undefined)
    };
    adminFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    const res = response();

    await AuthController.loginAdmin({ body: { email: 'admin@example.com', password: 'wrong-password' }, headers: {}, ip: '127.0.0.1' } as any, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(admin.failedLoginAttempts).toBe(0);
    expect(admin.lockedUntil).toBeInstanceOf(Date);
    expect(admin.lockedUntil.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
    expect(admin.save).toHaveBeenCalledTimes(1);
    expect(auditLog).toHaveBeenCalledWith('ADMIN_LOGIN_FAILED', 'admin', 'admin-1', '127.0.0.1', undefined, expect.objectContaining({ accountLocked: true }));
  });

  test('returns a Secure HttpOnly cookie instead of exposing an admin token in JSON', async () => {
    const admin: any = {
      _id: { toString: () => 'admin-1' },
      email: 'admin@example.com',
      name: 'Admin',
      roleId: { toString: () => 'role-1' },
      status: 'active',
      passwordHash: 'real-hash',
      failedLoginAttempts: 0,
      sessionVersion: 2,
      save: jest.fn().mockResolvedValue(undefined)
    };
    adminFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });
    roleFindById.mockResolvedValue({ name: 'Super Admin', permissions: ['*'] });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const res = response();

    await AuthController.loginAdmin({ body: { email: 'admin@example.com', password: 'correct-password' }, headers: {}, ip: '127.0.0.1' } as any, res);

    expect(admin.sessionVersion).toBe(3);
    expect(res.cookie).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 })
    );
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.tokens).toBeUndefined();
    expect(payload.data.sessionExpiresAt).toEqual(expect.any(String));
  });
});
