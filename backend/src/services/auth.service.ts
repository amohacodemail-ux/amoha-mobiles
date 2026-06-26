import supabase from '../config/supabase';
import { IUser } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt.util';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../errors/app-error';
import { sendPasswordResetEmail } from '../utils/email.util';
import { transformUser, transformRow, flattenKycForDb } from '../utils/transform.util';
import logger from '../utils/logger.util';
import env from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types';

const ADMIN_PANEL_ROLES: UserRole[] = [
  'admin', 'sales', 'purchase', 'marketing', 'logistics',
  'supplier', 'service_engineer', 'digital_marketing', 'purchase_inventory',
];

function resolvePortalBaseUrl(portal: 'admin' | 'store'): string {
  const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (portal === 'admin') {
    return (
      origins.find((origin) => origin.includes('admin.')) ||
      origins.find((origin) => origin.includes(':3003')) ||
      'http://localhost:3003'
    );
  }
  return (
    origins.find((origin) => !origin.includes('admin.') && !origin.includes(':3003') && !origin.includes(':3001')) ||
    origins[0] ||
    'http://localhost:3002'
  );
}

class AuthService {
  async register(data: { name: string; email: string; phone: string; password: string }) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', data.email.toLowerCase()).maybeSingle();
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await hashPassword(data.password);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: data.name, email: data.email.toLowerCase(), phone: data.phone, password: hashedPassword })
      .select('*')
      .single();
    if (error) throw error;

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const tokens = generateTokenPair(payload);

    await supabase.from('users').update({ refresh_token: tokens.refreshToken }).eq('id', user.id);

    return { user: transformUser(user), token: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async login(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();
    if (!user || error) throw new UnauthorizedError('Invalid email or password');
    if (user.is_blocked) throw new UnauthorizedError('Your account has been blocked. Please contact support.');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const tokens = generateTokenPair(payload);

    await supabase.from('users').update({ refresh_token: tokens.refreshToken }).eq('id', user.id);

    return { user: transformUser(user), token: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async refreshToken(refreshToken: string) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const { data: user } = await supabase
      .from('users').select('*').eq('id', decoded.userId).maybeSingle();
    if (!user || user.refresh_token !== refreshToken) throw new UnauthorizedError('Invalid refresh token');
    if (user.is_blocked) {
      await supabase.from('users').update({ refresh_token: null }).eq('id', user.id);
      throw new UnauthorizedError('Your account has been blocked. Please contact support.');
    }

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const tokens = generateTokenPair(payload);
    await supabase.from('users').update({ refresh_token: tokens.refreshToken }).eq('id', user.id);

    return { token: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string) {
    await supabase.from('users').update({ refresh_token: null }).eq('id', userId);
  }

  async getProfile(userId: string) {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!user) throw new NotFoundError('User');
    // Get addresses
    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at');
    const transformed = transformUser(user);
    transformed.addresses = (addresses || []).map(transformRow);
    return transformed;
  }

  async updateProfile(userId: string, updates: Partial<Pick<IUser, 'name' | 'phone' | 'avatar'>>) {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

    const { data: user, error } = await supabase
      .from('users').update(dbUpdates).eq('id', userId).select('*').single();
    if (error || !user) throw new NotFoundError('User');
    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId);
    const transformed = transformUser(user);
    transformed.addresses = (addresses || []).map(transformRow);
    return transformed;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { data: user } = await supabase.from('users').select('id, password').eq('id', userId).maybeSingle();
    if (!user) throw new NotFoundError('User');
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');
    const hashed = await hashPassword(newPassword);
    await supabase.from('users').update({ password: hashed }).eq('id', userId);
  }

  async forgotPassword(email: string, portal: 'admin' | 'store' = 'store') {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (!user) return;

    const isAdminPortal = portal === 'admin';
    if (isAdminPortal && !ADMIN_PANEL_ROLES.includes(user.role as UserRole)) {
      // Don't reveal whether the email exists — silently skip non-admin users
      return;
    }

    const resetToken = uuidv4();
    await supabase.from('users').update({
      reset_password_token: resetToken,
      reset_password_expiry: new Date(Date.now() + 3600000).toISOString(),
    }).eq('id', user.id);

    const baseUrl = resolvePortalBaseUrl(isAdminPortal ? 'admin' : 'store');
    sendPasswordResetEmail(user.email, user.name, resetToken, baseUrl, { portal }).catch((err: any) => {
      logger.error('Failed to send password reset email:', err?.message);
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const { data: user } = await supabase
      .from('users').select('id, reset_password_token, reset_password_expiry')
      .eq('reset_password_token', token)
      .gt('reset_password_expiry', new Date().toISOString())
      .maybeSingle();
    if (!user) throw new BadRequestError('Invalid or expired reset token');
    const hashed = await hashPassword(newPassword);
    await supabase.from('users').update({
      password: hashed,
      reset_password_token: null,
      reset_password_expiry: null,
      refresh_token: null,
    }).eq('id', user.id);
  }

  // RBAC - Create admin panel user with specific role
  async createAdminUser(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) {
    const { name, email, phone, password, role } = data;

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existingEmail) throw new ConflictError('Email already registered');

    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', phone).maybeSingle();
    if (existingPhone) throw new ConflictError('Phone number already registered');

    // Validate role is allowed for admin panel
    const allowedRoles: UserRole[] = ['admin', 'sales', 'purchase', 'marketing', 'logistics', 'supplier', 'service_engineer', 'digital_marketing', 'purchase_inventory'];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestError(`Role must be one of: ${allowedRoles.join(', ')}`);
    }

    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role: role,
        is_verified: true,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('User with this email or phone already exists');
      logger.error('[AuthService] createAdminUser error:', error);
      throw error;
    }

    return {
      user: transformUser(user),
      message: `Admin user created successfully with role: ${role}`,
    };
  }

  // RBAC - Update user role
  async updateUserRole(userId: string, newRole: UserRole) {
    const allowedRoles: UserRole[] = ['admin', 'sales', 'purchase', 'marketing', 'logistics', 'supplier', 'service_engineer', 'digital_marketing', 'purchase_inventory', 'user'];
    if (!allowedRoles.includes(newRole)) {
      throw new BadRequestError(`Role must be one of: ${allowedRoles.join(', ')}`);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !user) throw new NotFoundError('User');

    return {
      user: transformUser(user),
      message: `User role updated to: ${newRole}`,
    };
  }
}

export default new AuthService();
