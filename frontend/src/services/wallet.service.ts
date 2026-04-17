import apiClient from '@/lib/api-client';
import { ApiResponse, WalletBalance, WalletTransaction } from '@/types';

const walletService = {
  getBalance: async () => {
    const res = await apiClient.get<ApiResponse<WalletBalance>>('/wallet/balance');
    return res.data.data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<{ balance: number; transactions: WalletTransaction[]; totalItems: number; totalPages: number; currentPage: number }>>(`/wallet/transactions?page=${page}&limit=${limit}`);
    return res.data.data;
  },
};

export default walletService;
