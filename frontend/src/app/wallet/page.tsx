'use client';

import { useState, useEffect } from 'react';
import { FiCreditCard, FiArrowUpCircle, FiArrowDownCircle } from 'react-icons/fi';
import walletService from '@/services/wallet.service';
import { WalletTransaction } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    walletService
      .getTransactions()
      .then((data) => {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      })
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FiCreditCard className="w-6 h-6 opacity-80" />
          <span className="text-sm opacity-80">Available Balance</span>
        </div>
        <p className="text-3xl font-bold">{formatPrice(balance)}</p>
        <p className="text-xs opacity-60 mt-2">Use wallet balance during checkout</p>
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <FiCreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => (
            <div
              key={txn._id}
              className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {txn.type === 'credit' ? (
                  <FiArrowDownCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FiArrowUpCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                </p>
                <p className="text-xs text-gray-400">Bal: {formatPrice(txn.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
