import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import { sendWalletCreditEmail } from '../utils/email.util';
import logger from '../utils/logger.util';

class WalletService {
  async getWallet(userId: string) {
    let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!wallet) {
      const { data: newWallet, error } = await supabase
        .from('wallets').insert({ user_id: userId, balance: 0 }).select('*').single();
      if (error) throw error;
      wallet = newWallet;
    }
    return transformRow(wallet);
  }

  async getTransactions(userId: string, pageOrQuery: any = {}, limitArg?: number) {
    const wallet = await this.getWallet(userId);
    const page = typeof pageOrQuery === 'number' ? pageOrQuery : (parseInt(pageOrQuery.page) || 1);
    const limit = limitArg ?? (typeof pageOrQuery === 'object' ? parseInt(pageOrQuery.limit) || 20 : 20);
    const offset = (page - 1) * limit;

    let qb = supabase.from('wallet_transactions').select('*', { count: 'exact' }).eq('wallet_id', wallet._id || wallet.id);
    if (typeof pageOrQuery === 'object' && pageOrQuery.type) qb = qb.eq('type', pageOrQuery.type);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      transactions: (data || []).map(transformRow),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
      balance: wallet.balance,
    };
  }

  async credit(userId: string, amount: number, description: string, reference?: string) {
    if (amount <= 0) throw new BadRequestError('Amount must be positive');
    const wallet = await this.getWallet(userId);
    const walletId = wallet._id || wallet.id;

    const newBalance = (wallet.balance || 0) + amount;
    await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);

    const { data: txn, error } = await supabase.from('wallet_transactions').insert({
      wallet_id: walletId, type: 'credit', amount, balance_after: newBalance,
      description, reference: reference || null,
    }).select('*').single();
    if (error) throw error;

    // Send wallet credit notification email
    const { data: user } = await supabase.from('users').select('email, name').eq('id', userId).maybeSingle();
    if (user?.email) {
      sendWalletCreditEmail(user.email, user.name, amount, description, newBalance).catch((err: any) => {
        logger.error('Failed to send wallet credit email: ' + err?.message);
      });
    }

    return { wallet: { ...wallet, balance: newBalance }, transaction: transformRow(txn) };
  }

  async debit(userId: string, amount: number, description: string, reference?: string) {
    if (amount <= 0) throw new BadRequestError('Amount must be positive');
    const wallet = await this.getWallet(userId);
    if ((wallet.balance || 0) < amount) throw new BadRequestError('Insufficient wallet balance');
    const walletId = wallet._id || wallet.id;

    const newBalance = wallet.balance - amount;
    await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);

    const { data: txn, error } = await supabase.from('wallet_transactions').insert({
      wallet_id: walletId, type: 'debit', amount, balance_after: newBalance,
      description, reference: reference || null,
    }).select('*').single();
    if (error) throw error;

    return { wallet: { ...wallet, balance: newBalance }, transaction: transformRow(txn) };
  }

  async getWalletByAdmin(userId: string) {
    return this.getWallet(userId);
  }

  async adminCredit(userId: string, amount: number, description: string, _adminUserId?: string) {
    return this.credit(userId, amount, description, 'admin_credit');
  }

  // Controller aliases
  async getBalance(userId: string) { return this.getWallet(userId); }
  async getAllWallets(pageOrQuery?: any, limit?: number) {
    const page = typeof pageOrQuery === 'number' ? pageOrQuery : (parseInt(pageOrQuery?.page) || 1);
    const lim = limit ?? (typeof pageOrQuery === 'object' ? parseInt(pageOrQuery?.limit) || 20 : 20);
    const offset = (page - 1) * lim;
    const { data, error, count } = await supabase.from('wallets').select('*, user:user_id(id, name, email)', { count: 'exact' }).order('updated_at', { ascending: false }).range(offset, offset + lim - 1);
    if (error) throw error;
    return { wallets: (data || []).map(transformRow), pagination: { total: count || 0, page, limit: lim, pages: Math.ceil((count || 0) / lim) } };
  }
}

export default new WalletService();
