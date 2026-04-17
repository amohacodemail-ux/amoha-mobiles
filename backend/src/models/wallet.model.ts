export interface IWalletTransaction {
  _id?: string;
  id?: string;
  walletId?: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference?: string;
  referenceType?: 'order' | 'refund' | 'return' | 'cashback' | 'admin' | 'other';
  referenceId?: string;
  balanceAfter: number;
  createdAt?: Date;
}

export interface IWallet {
  _id?: string;
  id?: string;
  userId: string;
  user?: any;
  balance: number;
  transactions?: IWalletTransaction[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const WALLET_TABLE = 'wallets';
export const WALLET_TRANSACTION_TABLE = 'wallet_transactions';
