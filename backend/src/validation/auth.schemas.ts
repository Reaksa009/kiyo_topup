import { z } from 'zod';

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password is too long');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password,
    phone: z.string().trim().max(30).optional()
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});
