import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const activateAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const validateTokenQuerySchema = z.object({
  token: z.string().min(1, 'Token query param is required'),
});

export const otpRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required').trim(),
  purpose: z.string().optional().default('login'),
});

export const otpVerifySchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required').trim(),
  otp: z.string().length(6, 'OTP code must be exactly 6 digits').regex(/^\d{6}$/, 'OTP code must be 6 digits').trim(),
});

export const selectRoleSchema = z.object({
  preAuthToken: z.string().min(1, 'Pre-authentication token is required').trim(),
  selectedRoleId: z.string().min(1, 'Role selection ID is required').trim(),
});

export const googleVerifySchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required').trim(),
});

export const linkAccountSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required').trim(),
  idToken: z.string().min(1, 'Google ID token is required').trim(),
});

export const completeGoogleLinkSchema = z.object({
  preLinkToken: z.string().min(1, 'Pre-link token is required').trim(),
  phoneNumber: z.string().min(1, 'Phone number is required').trim(),
});

