import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

interface WalletContextType {
  wallet: Wallet | null;
  transactions: Transaction[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  // Wallet operations
  fundWallet: (amount: number, paymentMethod: string) => Promise<{ success: boolean; error?: string }>;
  withdrawFunds: (amount: number, accountDetails: string) => Promise<{ success: boolean; error?: string }>;
  makePayment: (productId: string, amount: number) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      loadWalletData();
    } else {
      setWallet(null);
      setTransactions([]);
      setOrders([]);
      setLoading(false);
    }
  }, [profile]);

  async function loadWalletData() {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadWallet(),
        loadTransactions(),
        loadOrders()
      ]);
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }

  async function loadWallet() {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (error) throw error;
    setWallet(data);
  }

  async function loadTransactions() {
    if (!profile || !wallet) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setTransactions(data || []);
  }

  async function loadOrders() {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setOrders(data || []);
  }

  async function fundWallet(amount: number, paymentMethod: string) {
    if (!profile || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    try {
      // Create a pending deposit transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'deposit',
          amount: amount,
          status: 'pending',
          description: `Wallet funding via ${paymentMethod}`,
          reference: `DEP_${Date.now()}`,
          metadata: { paymentMethod }
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // In a real app, you would integrate with a payment gateway here
      // For now, we'll simulate a successful payment after 2 seconds
      setTimeout(async () => {
        try {
          await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transaction.id);
          
          // Refresh wallet data
          await loadWalletData();
        } catch (err) {
          console.error('Error completing deposit:', err);
        }
      }, 2000);

      return { success: true };
    } catch (err) {
      console.error('Error funding wallet:', err);
      return { success: false, error: 'Failed to fund wallet' };
    }
  }

  async function withdrawFunds(amount: number, accountDetails: string) {
    if (!profile || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      // Create a pending withdrawal transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount: -amount, // Negative for withdrawal
          status: 'pending',
          description: `Withdrawal to ${accountDetails}`,
          reference: `WTH_${Date.now()}`,
          metadata: { accountDetails }
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // In a real app, you would integrate with a payment gateway here
      // For now, we'll simulate a successful withdrawal after 3 seconds
      setTimeout(async () => {
        try {
          await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transaction.id);
          
          // Refresh wallet data
          await loadWalletData();
        } catch (err) {
          console.error('Error completing withdrawal:', err);
        }
      }, 3000);

      return { success: true };
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      return { success: false, error: 'Failed to withdraw funds' };
    }
  }

  async function makePayment(productId: string, amount: number) {
    if (!profile || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: profile.id,
          product_id: productId,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'payment',
          amount: -amount, // Negative for payment
          status: 'completed', // Immediate payment from wallet
          description: `Payment for ${product.title}`,
          reference: `PAY_${Date.now()}`,
          metadata: { orderId: order.id, productId }
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update order with payment transaction
      await supabase
        .from('orders')
        .update({ 
          payment_transaction_id: transaction.id,
          status: 'paid'
        })
        .eq('id', order.id);

      // Refresh wallet data
      await loadWalletData();

      return { success: true, orderId: order.id };
    } catch (err) {
      console.error('Error making payment:', err);
      return { success: false, error: 'Failed to make payment' };
    }
  }

  async function refreshWallet() {
    await loadWallet();
  }

  async function refreshTransactions() {
    await loadTransactions();
  }

  async function refreshOrders() {
    await loadOrders();
  }

  return (
    <WalletContext.Provider value={{
      wallet,
      transactions,
      orders,
      loading,
      error,
      fundWallet,
      withdrawFunds,
      makePayment,
      refreshWallet,
      refreshTransactions,
      refreshOrders
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
