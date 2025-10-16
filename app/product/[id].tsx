import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { ArrowLeft, Star } from 'lucide-react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles: { full_name: string | null } | null;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgStars, setAvgStars] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
        ) : null}

        <View style={styles.content}>
          <Text style={styles.price}>{formatNaira(product.price)}</Text>
          <Text style={styles.seller}>Sold by {product.profiles?.full_name || 'Unknown'}</Text>

          <View style={styles.ratingRow}>
            <Star size={18} color={avgStars ? '#f5a623' : '#ccc'} fill={avgStars ? '#f5a623' : 'none'} />
            <Text style={styles.ratingText}>{avgStars ? avgStars.toFixed(1) : '—'} ({ratingsCount})</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description || 'No description provided.'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
  },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  productImage: { width: '100%', height: 280, backgroundColor: '#f0f0f0' },
  content: { padding: 16 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  seller: { fontSize: 14, color: '#666', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  ratingText: { fontSize: 14, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  description: { fontSize: 14, color: '#333', lineHeight: 20 },
});


