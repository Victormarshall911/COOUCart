import { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, CreditCard, Lock } from 'lucide-react-native';

interface PaystackPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: (transactionRef: string) => void;
}

export default function PaystackPaymentModal({
  visible,
  onClose,
  amount,
  onSuccess,
}: PaystackPaymentModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc || !cardName) {
      Alert.alert('Incomplete Details', 'Please fill in all card details');
      return;
    }

    const [month, year] = expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      Alert.alert('Invalid Expiry', 'Please enter expiry date as MM/YY');
      return;
    }

    setLoading(true);

    try {
      // In a real app, you would call your backend API to create a Paystack transaction
      // Then use the Paystack SDK to charge the card
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionRef = `COOU_${Date.now()}`;
      
      Alert.alert(
        'Payment Successful!',
        `Your wallet has been funded with ₦${amount.toLocaleString()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(transactionRef);
              onClose();
              resetForm();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'Please check your card details and try again');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvc('');
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
            <CreditCard size={24} color="#007AFF" />
            <Text style={styles.headerTitle}>Card Payment</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatNaira(amount)}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={cardName}
              onChangeText={setCardName}
              placeholderTextColor="#999"
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={expiry}
                  onChangeText={(text) => setExpiry(formatExpiry(text))}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cvc}
                  onChangeText={(text) => setCvc(text.replace(/\D/g, '').slice(0, 3))}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Pay {formatNaira(amount)}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.security}>
              <Lock size={16} color="#6a6a6a" />
              <Text style={styles.securityText}>
                Your payment is secured and encrypted by Paystack
              </Text>
            </View>
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              🔒 Test Card: 4084 0840 8408 4081{'\n'}
              CVV: Any 3 digits{'\n'}
              Expiry: Any future date
            </Text>
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
  amountCard: {
    backgroundColor: '#10B981',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a4a4a',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#4a4a4a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#007AFF',
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
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#6a6a6a',
    flex: 1,
  },
  note: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
