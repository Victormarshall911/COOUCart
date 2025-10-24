import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Star, ShoppingCart } from 'lucide-react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles: { full_name: string | null } | null;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgStars, setAvgStars] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const { profile } = useAuth();
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

  async function handleBuy() {
    if (!profile) return;

    if (profile.role !== 'customer') {
      alert('Only customers can purchase products');
      return;
    }

    if (!product) return;

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
      alert('Failed to start chat. Please try again.');
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
            <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  buyButton: {
    backgroundColor: '#6a6a6a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6a6a6a',
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
});


