import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Admin, Role } from '../models/Admin';
import { ADMIN_SESSION_COOKIE, readCookie } from '../utils/adminSession';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: 'user' | 'admin';
    roleId?: string;
    permissions?: string[];
    sessionVersion?: number;
  };
}

export const authenticateJwt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const adminCookieToken = readCookie(req.headers.cookie, ADMIN_SESSION_COOKIE);
  const token = bearerToken || adminCookieToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (decoded.type === 'admin') {
      if (
        decoded.tokenUse !== 'admin-session' ||
        decoded.iss !== 'kiyo-topup' ||
        decoded.aud !== 'kiyo-admin' ||
        !Number.isInteger(decoded.sessionVersion)
      ) {
        return res.status(401).json({ success: false, message: 'Invalid or expired admin session.' });
      }

      const method = (req.method || 'GET').toUpperCase();
      if (adminCookieToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const origin = req.get('origin');
        let sameOrigin = false;
        try {
          sameOrigin = Boolean(origin && new URL(origin).host === req.get('host'));
        } catch {
          sameOrigin = false;
        }
        if (!sameOrigin) {
          return res.status(403).json({ success: false, message: 'Untrusted admin request origin.' });
        }
      }

      const admin = await Admin.findById(decoded.id).select('email status roleId +sessionVersion');
      if (!admin || admin.status !== 'active' || admin.sessionVersion !== decoded.sessionVersion) {
        return res.status(401).json({ success: false, message: 'Invalid or expired admin session.' });
      }
      const role = await Role.findById(admin.roleId).select('permissions');
      if (!role) {
        return res.status(403).json({ success: false, message: 'Admin role is unavailable.' });
      }
      req.user = {
        id: admin._id.toString(),
        email: admin.email,
        type: 'admin',
        roleId: admin.roleId.toString(),
        permissions: role.permissions,
        sessionVersion: admin.sessionVersion
      };
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    } else {
      req.user = decoded;
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Superadmin or Admin privilege required.' });
  }

  // Load role & permissions if not attached
  if (!req.user.permissions && req.user.roleId) {
    const role = await Role.findById(req.user.roleId);
    if (role) {
      req.user.permissions = role.permissions;
    }
  }

  next();
};

export const requirePermission = (permissionKey: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
    }

    if (!req.user.permissions && req.user.roleId) {
      const role = await Role.findById(req.user.roleId);
      if (role) {
        req.user.permissions = role.permissions;
      }
    }

    const hasPermission =
      req.user.permissions?.includes('*') || req.user.permissions?.includes(permissionKey);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Required permission '${permissionKey}' is missing.`
      });
    }

    next();
  };
};
