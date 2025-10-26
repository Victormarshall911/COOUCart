import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowLeft, Star, ShoppingCart, Wallet, MessageCircle } from 'lucide-react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles: { full_name: string | null } | null;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgStars, setAvgStars] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { profile } = useAuth();
  const { wallet, makePayment } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      setProduct(data as Product);
      await loadBusinessRating((data as any).owner_id as string);
    } catch (e) {
      console.error('Error loading product:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinessRating(businessId: string) {
    try {
      const { data, count, error } = await supabase
        .from('ratings')
        .select('stars', { count: 'exact' })
        .eq('business_id', businessId);
      if (error) throw error;
      const stars = (data || []).map(r => (r as any).stars as number);
      const total = stars.reduce((a, b) => a + b, 0);
      const avg = stars.length ? total / stars.length : null;
      setAvgStars(avg);
      setRatingsCount(count || 0);
    } catch (e) {
      console.error('Error loading business rating:', e);
    }
  }

  const formatNaira = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  async function handleBuyWithWallet() {
    if (!profile || !product || !wallet) return;

    if (profile.role !== 'customer') {
      Alert.alert('Error', 'Only customers can purchase products');
      return;
    }

    if (wallet.balance < product.price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${formatNaira(product.price - wallet.balance)} more to purchase this item.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund Wallet', onPress: () => router.push('/wallet') }
        ]
      );
      return;
    }

    setShowPaymentModal(true);
  }

  async function confirmPayment() {
    if (!product) return;

    setProcessingPayment(true);
    const result = await makePayment(product.id, product.price);
    setProcessingPayment(false);

    if (result.success) {
      Alert.alert(
        'Payment Successful!',
        'Your order has been placed successfully.',
        [
          { 
            text: 'View Orders', 
            onPress: () => router.push('/orders') 
          },
          { 
            text: 'Continue Shopping', 
            onPress: () => router.back() 
          }
        ]
      );
      setShowPaymentModal(false);
    } else {
      Alert.alert('Payment Failed', result.error || 'Failed to process payment');
    }
  }

  async function handleChat() {
    if (!profile || !product) return;

    try {
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', profile.id)
        .maybeSingle();

      if (chatError) throw chatError;

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
      } else {
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            product_id: product.id,
            buyer_id: profile.id,
            business_id: product.owner_id,
          })
          .select()
          .single();

        if (createError) throw createError;
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6a6a6a" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#4a4a4a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatNaira(product.price)}</Text>
          <Text style={styles.seller}>Sold by {product.profiles?.full_name || 'Unknown'}</Text>

          <View style={styles.ratingRow}>
            <Star size={18} color={avgStars ? '#f5a623' : '#ccc'} fill={avgStars ? '#f5a623' : 'none'} />
            <Text style={styles.ratingText}>{avgStars ? avgStars.toFixed(1) : '—'} ({ratingsCount})</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description || 'No description provided.'}</Text>

          {profile?.role === 'customer' && profile?.id !== product.owner_id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.buyButton} onPress={handleBuyWithWallet}>
                <Wallet size={20} color="#fff" />
                <Text style={styles.buyButtonText}>Buy with Wallet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                <MessageCircle size={20} color="#007AFF" />
                <Text style={styles.chatButtonText}>Message Seller</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentItem}>Item: {product.title}</Text>
              <Text style={styles.paymentAmount}>Amount: {formatNaira(product.price)}</Text>
              <Text style={styles.paymentBalance}>
                Wallet Balance: {formatNaira(wallet?.balance || 0)}
              </Text>
              <Text style={styles.paymentRemaining}>
                Remaining: {formatNaira((wallet?.balance || 0) - product.price)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.confirmButton, processingPayment && styles.confirmButtonDisabled]}
              onPress={confirmPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: '#fafafa', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e8e8e8'
  },
  backButton: { 
    padding: 8, 
    marginRight: 8 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#4a4a4a' 
  },
  productImage: { 
    width: '100%', 
    height: 300, 
    backgroundColor: '#f0f0f0' 
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8a8a8a',
    fontSize: 16,
  },
  content: { 
    padding: 20 
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4a4a4a',
    marginBottom: 12,
  },
  price: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#6a6a6a', 
    marginBottom: 8 
  },
  seller: { 
    fontSize: 16, 
    color: '#6a6a6a', 
    marginBottom: 16 
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 24 
  },
  ratingText: { 
    fontSize: 16, 
    color: '#6a6a6a' 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#4a4a4a', 
    marginBottom: 12 
  },
  description: { 
    fontSize: 16, 
    color: '#5a5a5a', 
    lineHeight: 24,
    marginBottom: 32
  },
  actionButtons: {
    gap: 12,
  },
  buyButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  chatButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
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
  paymentSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  paymentItem: {
    fontSize: 16,
    color: '#4a4a4a',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 8,
  },
  paymentBalance: {
    fontSize: 16,
    color: '#6a6a6a',
    marginBottom: 4,
  },
  paymentRemaining: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});


