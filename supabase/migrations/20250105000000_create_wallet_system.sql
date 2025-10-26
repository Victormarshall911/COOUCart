/*
  # Wallet System Database Schema

  ## Overview
  This migration creates the wallet system for the marketplace app, enabling users to:
  - Maintain wallet balances
  - Fund wallets from external sources
  - Withdraw funds to external accounts
  - Make payments for purchases
  - Track transaction history

  ## Tables

  ### `wallets`
  User wallet information and balances
  - `id` (uuid, primary key)
  - `user_id` (uuid, required) - References profiles(id)
  - `balance` (numeric, default 0) - Current wallet balance in NGN
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `transactions`
  All wallet transactions (funding, withdrawal, payments)
  - `id` (uuid, primary key)
  - `wallet_id` (uuid, required) - References wallets(id)
  - `type` (text, required) - 'deposit', 'withdrawal', 'payment', 'refund'
  - `amount` (numeric, required) - Transaction amount (positive for deposits/refunds, negative for withdrawals/payments)
  - `status` (text, default 'pending') - 'pending', 'completed', 'failed', 'cancelled'
  - `description` (text) - Transaction description
  - `reference` (text, unique) - External payment reference
  - `metadata` (jsonb) - Additional transaction data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `orders`
  Purchase orders with wallet payments
  - `id` (uuid, primary key)
  - `buyer_id` (uuid, required) - References profiles(id)
  - `product_id` (uuid, required) - References products(id)
  - `amount` (numeric, required) - Order total
  - `status` (text, default 'pending') - 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  - `payment_transaction_id` (uuid) - References transactions(id)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security (RLS)
  - Users can only access their own wallets and transactions
  - Orders are accessible by buyer and product owner
  - All tables have Row Level Security enabled
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  reference text UNIQUE,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Product owners can view orders for their products"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.product_id
      AND products.owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Product owners can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.product_id
      AND products.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.product_id
      AND products.owner_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_user();

-- Function to update wallet balance when transaction is completed
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance when transaction status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE wallets
    SET balance = balance + NEW.amount
    WHERE id = NEW.wallet_id;
  END IF;
  
  -- Revert balance if transaction is cancelled or failed
  IF (NEW.status = 'cancelled' OR NEW.status = 'failed') AND OLD.status = 'completed' THEN
    UPDATE wallets
    SET balance = balance - OLD.amount
    WHERE id = NEW.wallet_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet balance on transaction status change
CREATE TRIGGER update_wallet_balance_on_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- Insert sample categories if they don't exist
INSERT INTO categories (name) VALUES 
  ('Electronics'),
  ('Clothing'),
  ('Books'),
  ('Home & Garden'),
  ('Sports'),
  ('Beauty'),
  ('Food & Beverages'),
  ('Automotive')
ON CONFLICT (name) DO NOTHING;
