import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import FundWalletModal from '@/components/FundWalletModal';
import { Wallet, Plus, Minus, ArrowUpRight, ArrowDownLeft, CreditCard, History } from 'lucide-react-native';

export default function WalletScreen() {
  const { wallet, transactions, orders, loading, fundWallet, withdrawFunds, refreshWallet, refreshTransactions } = useWallet();
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={20} color="#10B981" />;
      case 'withdrawal':
        return <ArrowUpRight size={20} color="#EF4444" />;
      case 'payment':
        return <CreditCard size={20} color="#F59E0B" />;
      case 'refund':
        return <ArrowDownLeft size={20} color="#3B82F6" />;
      default:
        return <Wallet size={20} color="#6B7280" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return '#10B981';
      case 'withdrawal':
        return '#EF4444';
      case 'payment':
        return '#F59E0B';
      case 'refund':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshWallet(), refreshTransactions()]);
    setRefreshing(false);
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    setProcessing(true);
    const result = await fundWallet(amount, 'Bank Transfer');
    setProcessing(false);

    if (result.success) {
      Alert.alert('Success', 'Wallet funding initiated. Transaction will be processed shortly.');
      setShowFundModal(false);
      setFundAmount('');
    } else {
      Alert.alert('Error', result.error || 'Failed to fund wallet');
    }
  };

  const handleWithdrawFunds = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (!accountDetails.trim()) {
      Alert.alert('Missing Details', 'Please provide account details for withdrawal');
      return;
    }

    setProcessing(true);
    const result = await withdrawFunds(amount, accountDetails);
    setProcessing(false);

    if (result.success) {
      Alert.alert('Success', 'Withdrawal initiated. Funds will be transferred shortly.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setAccountDetails('');
    } else {
      Alert.alert('Error', result.error || 'Failed to withdraw funds');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6a6a6a" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Wallet size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {profile?.role === 'customer' ? 'Manage your wallet balance' : 'View your earnings'}
        </Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {wallet ? formatNaira(wallet.balance) : '₦0'}
        </Text>
        
        {profile?.role === 'customer' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.fundButton]}
              onPress={() => setShowFundModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Fund Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Minus size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <History size={20} color="#6a6a6a" />
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Wallet size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.slice(0, 10).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  {getTransactionIcon(transaction.type)}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || transaction.type}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.created_at)}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    { color: getTransactionColor(transaction.type) }
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}{formatNaira(transaction.amount)}
                  </Text>
                  <Text style={[
                    styles.transactionStatus,
                    { color: transaction.status === 'completed' ? '#10B981' : '#F59E0B' }
                  ]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Fund Wallet Modal */}
      <FundWalletModal 
        visible={showFundModal}
        onClose={() => setShowFundModal(false)}
      />

      {/* Withdraw Funds Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Account Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bank account number, mobile money, etc."
              value={accountDetails}
              onChangeText={setAccountDetails}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.modalNote}>
              Withdrawals are processed within 24-48 hours.
            </Text>
            
            <TouchableOpacity 
              style={[styles.modalButton, processing && styles.modalButtonDisabled]}
              onPress={handleWithdrawFunds}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Withdraw Funds</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a4a4a',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6a6a6a',
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6a6a6a',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4a4a4a',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  fundButton: {
    backgroundColor: '#10B981',
  },
  withdrawButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a4a4a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6a6a6a',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a4a4a',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6a6a6a',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8a8a8a',
    textAlign: 'center',
    marginTop: 4,
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a4a4a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#8a8a8a',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4a4a4a',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a4a4a',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#4a4a4a',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalNote: {
    fontSize: 14,
    color: '#6a6a6a',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
