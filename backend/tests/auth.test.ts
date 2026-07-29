import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Authentication & Security Unit Verification', () => {
  it('should hash passwords securely with bcrypt', async () => {
    const rawPassword = 'SecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);
  });

  it('should sign and verify JWT access tokens correctly', () => {
    const payload = { id: 'usr_123', email: 'test@kiyotopup.com', type: 'user' };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    expect(token).toBeDefined();

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    expect(decoded.id).toBe('usr_123');
    expect(decoded.email).toBe('test@kiyotopup.com');
  });
});
