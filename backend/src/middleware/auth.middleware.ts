import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Admin, IRole, Role } from '../models/Admin';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: 'user' | 'admin';
    roleId?: string;
    permissions?: string[];
  };
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
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
