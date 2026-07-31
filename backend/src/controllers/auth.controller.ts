import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Admin, Role } from '../models/Admin';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

const generateTokens = (payload: object) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
  return { accessToken, refreshToken };
};

const databaseUnavailable = (res: Response) =>
  res.status(503).json({
    success: false,
    message: 'Authentication service is temporarily unavailable.'
  });

export class AuthController {
  static async registerUser(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;

      if (mongoose.connection.readyState !== 1) {
        return databaseUnavailable(res);
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      const referralCode = `KIYO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone || '',
        referralCode
      });

      const tokens = generateTokens({ id: user._id, email: user.email, type: 'user' });
      await AuditService.log('USER_REGISTERED', 'user', user._id.toString(), req.ip, req.headers['user-agent']);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            walletBalance: user.walletBalance,
            referralCode: user.referralCode
          },
          tokens
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (mongoose.connection.readyState !== 1) {
        return databaseUnavailable(res);
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const tokens = generateTokens({ id: user._id, email: user.email, type: 'user' });
      await AuditService.log('USER_LOGIN', 'user', user._id.toString(), req.ip, req.headers['user-agent']);

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            walletBalance: user.walletBalance,
            savedPlayerIds: user.savedPlayerIds,
            referralCode: user.referralCode
          },
          tokens
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async loginAdmin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const targetEmail = email.trim().toLowerCase();

      if (mongoose.connection.readyState !== 1) {
        return databaseUnavailable(res);
      }

      const admin = await Admin.findOne({ email: targetEmail });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      if (admin.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Admin account is inactive.' });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      const role = await Role.findById(admin.roleId);
      if (!role) {
        return res.status(403).json({ success: false, message: 'Admin role is unavailable.' });
      }
      const permissions = role.permissions;

      admin.lastLoginAt = new Date();
      await admin.save();

      const tokens = generateTokens({
        id: admin._id,
        email: admin.email,
        type: 'admin',
        roleId: admin.roleId,
        permissions
      });

      await AuditService.log('ADMIN_LOGIN', 'admin', admin._id.toString(), req.ip, req.headers['user-agent']);

      return res.json({
        success: true,
        message: 'Admin authenticated successfully.',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            roleName: role.name,
            permissions
          },
          tokens
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Authentication error.' });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

      if (req.user.type === 'admin') {
        const admin = await Admin.findById(req.user.id).select('-passwordHash');
        if (!admin || admin.status !== 'active') {
          return res.status(401).json({ success: false, message: 'Admin account is unavailable.' });
        }
        const role = await Role.findById(admin.roleId);
        if (!role) return res.status(403).json({ success: false, message: 'Admin role is unavailable.' });
        return res.json({
          success: true,
          data: {
            admin: {
              id: admin._id,
              name: admin.name,
              email: admin.email,
              roleName: role.name,
              permissions: role.permissions
            }
          }
        });
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user || user.status === 'blocked') {
        return res.status(401).json({ success: false, message: 'User account is unavailable.' });
      }
      return res.json({ success: true, data: { user } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
