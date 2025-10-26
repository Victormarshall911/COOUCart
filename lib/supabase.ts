import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
    storageKey: 'supabase.auth.token',
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'business' | 'customer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: 'business' | 'customer';
        };
        Update: {
          full_name?: string | null;
          role?: 'business' | 'customer';
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price: number;
          image_url: string | null;
          owner_id: string;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          owner_id: string;
          category_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category_id?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          name: string;
        };
        Update: {
          name?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          product_id: string;
          buyer_id: string;
          business_id: string;
          status: 'open' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          buyer_id: string;
          business_id: string;
          status?: 'open' | 'closed';
        };
        Update: {
          status?: 'open' | 'closed';
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          chat_id: string;
          sender_id: string;
          content: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          balance?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
          amount: number;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          description: string | null;
          reference: string | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_id: string;
          type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
          amount: number;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          reference?: string | null;
          metadata?: any | null;
        };
        Update: {
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          metadata?: any | null;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          product_id: string;
          amount: number;
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          payment_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          product_id: string;
          amount: number;
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          payment_transaction_id?: string | null;
        };
        Update: {
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          payment_transaction_id?: string | null;
        };
      };
    };
  };
};
