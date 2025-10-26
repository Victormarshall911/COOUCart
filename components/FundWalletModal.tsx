import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Copy, Check, Building2, CreditCard, Wallet } from 'lucide-react-native';
import PaystackPaymentModal from './PaystackPaymentModal';

type BankDetails = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

export default function FundWalletModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const { fundWallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('card');

  // Generate virtual account details
  useEffect(() => {
    if (visible && !bankDetails) {
      generateVirtualAccount();
    }
  }, [visible]);

  const generateVirtualAccount = async () => {
    // Generate unique account number based on user ID
    if (!profile) return;
    
    const accountNumber = `20${profile.id.slice(0, 8).replace(/-/g, '')}`;
    const accountName = profile.full_name?.toUpperCase() || 'COOU CART USER';
    
    setBankDetails({
      accountName,
      accountNumber,
      bankName: 'Providus Bank'
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    // In a real app, you'd use Clipboard API
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    Alert.alert('Copied!', `${type} copied to clipboard`);
  };

  const handleFundWallet = async () => {
    const fundAmount = parseFloat(amount);
    
    if (isNaN(fundAmount) || fundAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (fundAmount < 100) {
      Alert.alert('Minimum Amount', 'Minimum funding amount is ₦100');
      return;
    }

    setLoading(true);
    
    const result = await fundWallet(fundAmount, 'Bank Transfer - Providus Bank');
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Instructions',
        'Please transfer the amount to the virtual account shown. Your wallet will be credited automatically once payment is confirmed.',
        [
          {
            text: 'I Understand',
            onPress: () => {}
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to initiate funding');
    }
  };

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Wallet size={24} color="#007AFF" />
            <Text style={styles.headerTitle}>Fund Wallet</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter Amount (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="1000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
              autoFocus
            />
            <Text style={styles.hint}>Minimum: ₦100</Text>
          </View>

          {/* Virtual Account Details */}
          {bankDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer to This Account</Text>
              
              <View style={styles.bankCard}>
                <View style={styles.bankCardHeader}>
                  <Building2 size={24} color="#007AFF" />
                  <Text style={styles.bankName}>{bankDetails.bankName}</Text>
                </View>
                
                <View style={styles.bankDetailsRow}>
                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>Account Name</Text>
                    <View style={styles.bankDetailValue}>
                      <Text style={styles.bankDetailText}>{bankDetails.accountName}</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(bankDetails.accountName, 'name')}
                        style={styles.copyButton}
                      >
                        {copied === 'name' ? (
                          <Check size={16} color="#10B981" />
                        ) : (
                          <Copy size={16} color="#666" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>Account Number</Text>
                    <View style={styles.bankDetailValue}>
                      <Text style={styles.bankDetailText}>{bankDetails.accountNumber}</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(bankDetails.accountNumber, 'number')}
                        style={styles.copyButton}
                      >
                        {copied === 'number' ? (
                          <Check size={16} color="#10B981" />
                        ) : (
                          <Copy size={16} color="#666" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>How to Fund:</Text>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionText}>Open your mobile banking app</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionText}>Transfer the amount to the account above</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionText}>Your wallet will be credited automatically within minutes</Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleFundWallet}
                disabled={loading || !amount}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Continue Transfer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Payment Methods</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity style={styles.paymentMethodCard}>
                <Text style={styles.paymentMethodTitle}>Bank Transfer</Text>
                <Text style={styles.paymentMethodDescription}>Use the virtual account above</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethodCard}>
                <Text style={styles.paymentMethodTitle}>Paystack</Text>
                <Text style={styles.paymentMethodDescription}>Coming Soon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethodCard}>
                <Text style={styles.paymentMethodTitle}>Flutterwave</Text>
                <Text style={styles.paymentMethodDescription}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4a4a4a',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#4a4a4a',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#6a6a6a',
    marginTop: 8,
    textAlign: 'center',
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  bankDetailsRow: {
    gap: 20,
  },
  bankDetailItem: {
    marginBottom: 16,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: '#6a6a6a',
    marginBottom: 8,
    fontWeight: '500',
  },
  bankDetailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  bankDetailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a4a4a',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
  },
  instructions: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6a6a6a',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#6a6a6a',
  },
});
