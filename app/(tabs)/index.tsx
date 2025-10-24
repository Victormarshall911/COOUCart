import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Image, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ShoppingCart, Filter, X } from 'lucide-react-native';

type Product = Database['public']['Tables']['products']['Row'] & {
  profiles: { full_name: string | null } | null;
};

type Category = {
  id: string;
  name: string;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadProducts() {
    try {
      let query = supabase
        .from('products')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredProducts = data || [];

      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) filteredProducts = filteredProducts.filter(p => p.price >= min);
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) filteredProducts = filteredProducts.filter(p => p.price <= max);
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleBuy(product: Product) {
    if (!profile) return;
    if (profile.role !== 'customer') {
      alert('Only customers can purchase products');
      return;
    }

    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', profile.id)
        .maybeSingle();

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

  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  function renderProduct({ item }: { item: Product }) {
    return (
      <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product/${item.id}`)}>
        <View style={styles.productImageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.productPrice}>{formatNaira(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6a6a6a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/V.png')} style={styles.logo} />
            <Text style={styles.headerTitle}>COOUCart</Text>
          </View>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
            <ShoppingCart size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {profile?.role === 'business' ? 'Browse all products' : 'Find what you need'}
        </Text>

        {/* Search + Filter in same row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color="#fff" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            <TouchableOpacity
              key="all"
              style={[styles.categoryButton, selectedCategory === '' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.categoryText, selectedCategory === '' && styles.categoryTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.priceFilterRow}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>Min Price (₦)</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>Max Price (₦)</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="10000"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCategory('');
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              <X size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Search size={64} color="#ccc" />
          <Text style={styles.emptyText}>No products available</Text>
          <Text style={styles.emptySubtext}>
            {profile?.role === 'business'
              ? 'Start by adding your first product'
              : 'Check back later for new items'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadProducts();
            }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 6 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#4a4a4a' },
  cartButton: { padding: 8, borderRadius: 8, backgroundColor: '#e8e8e8' },
  headerSubtitle: { fontSize: 16, color: '#6a6a6a', marginBottom: 16 },

  // Search + Filter Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d8d8d8',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#4a4a4a' },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  filterText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 6 },

  // Filters section
  filtersContainer: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  categoriesRow: { marginBottom: 16 },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  categoryButtonActive: { backgroundColor: '#6a6a6a', borderColor: '#6a6a6a' },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#6a6a6a' },
  categoryTextActive: { color: '#fff' },
  priceFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInputContainer: { flex: 1 },
  priceLabel: { fontSize: 12, color: '#6a6a6a', marginBottom: 4, fontWeight: '500' },
  priceInput: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d8d8d8',
  },
  clearFiltersButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  row: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 180, backgroundColor: '#f0f0f0' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#8a8a8a', fontSize: 14 },
  productInfo: { padding: 16 },
  productTitle: { fontSize: 16, fontWeight: '600', color: '#4a4a4a', marginBottom: 8, lineHeight: 22 },
  productPrice: { fontSize: 18, fontWeight: '700', color: '#6a6a6a' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#6a6a6a', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#8a8a8a', textAlign: 'center', marginTop: 8 },
});
