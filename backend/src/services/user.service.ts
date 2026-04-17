import supabase from '../config/supabase';
import { transformRow, toDbRow, transformUser, flattenKycForDb } from '../utils/transform.util';
import { hashPassword } from '../utils/password.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

class UserService {
  async getAllUsers(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('users').select('*', { count: 'exact' });

    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,phone.ilike.%${query.search}%`);
    }
    if (query.role) qb = qb.eq('role', query.role);
    if (query.isBlocked !== undefined) qb = qb.eq('is_blocked', query.isBlocked === 'true');

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder === 'asc';
    qb = qb.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

    const { data: users, error, count } = await qb;
    if (error) throw error;

    return {
      users: (users || []).map(transformUser),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getUserById(userId: string) {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!user) throw new NotFoundError('User');
    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at');
    const transformed = transformUser(user);
    transformed.addresses = (addresses || []).map(transformRow);
    return transformed;
  }

  async updateUser(userId: string, updates: any) {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.isBlocked !== undefined) dbUpdates.is_blocked = updates.isBlocked;
    if (updates.password) dbUpdates.password = await hashPassword(updates.password);
    if (updates.kyc) Object.assign(dbUpdates, flattenKycForDb(updates.kyc));

    const { data: user, error } = await supabase.from('users').update(dbUpdates).eq('id', userId).select('*').single();
    if (error) throw error;
    if (!user) throw new NotFoundError('User');
    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId);
    const transformed = transformUser(user);
    transformed.addresses = (addresses || []).map(transformRow);
    return transformed;
  }

  async deleteUser(userId: string) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  }

  async blockUser(userId: string) {
    const { data: user, error } = await supabase
      .from('users').update({ is_blocked: true, refresh_token: null }).eq('id', userId).select('*').single();
    if (error || !user) throw new NotFoundError('User');
    return transformUser(user);
  }

  async unblockUser(userId: string) {
    const { data: user, error } = await supabase
      .from('users').update({ is_blocked: false }).eq('id', userId).select('*').single();
    if (error || !user) throw new NotFoundError('User');
    return transformUser(user);
  }

  async addAddress(userId: string, address: any) {
    if (address.isDefault) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    }
    const { country: _c, ...addressWithoutCountry } = address;
    const { data, error } = await supabase
      .from('addresses').insert({ ...toDbRow(addressWithoutCountry), user_id: userId }).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateAddress(userId: string, addressId: string, updates: any) {
    if (updates.isDefault) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    }
    const { country: _c, ...updatesWithoutCountry } = updates;
    const { data, error } = await supabase
      .from('addresses').update(toDbRow(updatesWithoutCountry)).eq('id', addressId).eq('user_id', userId).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Address');
    return transformRow(data);
  }

  async deleteAddress(userId: string, addressId: string) {
    const { error } = await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', userId);
    if (error) throw error;
  }

  async updateKyc(userId: string, kycData: any) {
    const flat = flattenKycForDb(kycData);
    const { data: user, error } = await supabase
      .from('users').update(flat).eq('id', userId).select('*').single();
    if (error) throw error;
    return transformUser(user);
  }

  async verifyKyc(userId: string, status: string) {
    const { data: user, error } = await supabase
      .from('users').update({ kyc_status: status }).eq('id', userId).select('*').single();
    if (error) throw error;
    return transformUser(user);
  }
}

export default new UserService();
