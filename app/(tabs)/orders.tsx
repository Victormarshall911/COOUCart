import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react-native';

type Order = Database['public']['Tables']['orders']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};

export default function OrdersScreen() {
  const { orders, loading, refreshOrders } = useWallet();
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [ordersWithProducts, setOrdersWithProducts] = useState<Order[]>([]);

  useEffect(() => {
    if (orders.length > 0) {
      loadOrdersWithProducts();
    }
  }, [orders]);

  async function loadOrdersWithProducts() {
    try {
      const orderIds = orders.map(order => order.id);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (*)
        `)
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrdersWithProducts(ordersData as Order[]);
    } catch (error) {
      console.error('Error loading orders with products:', error);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      case 'paid':
        return <CheckCircle size={20} color="#10B981" />;
      case 'shipped':
        return <Truck size={20} color="#3B82F6" />;
      case 'delivered':
        return <CheckCircle size={20} color="#10B981" />;
      case 'cancelled':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Package size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'paid':
        return '#10B981';
      case 'shipped':
        return '#3B82F6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  function renderOrder({ item }: { item: Order }) {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item.id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          {item.products.image_url ? (
            <Image source={{ uri: item.products.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Package size={24} color="#ccc" />
            </View>
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.products.title}
            </Text>
            <Text style={styles.productPrice}>{formatNaira(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Package size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {ordersWithProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={64} color="#ccc" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>
            Your order history will appear here when you make purchases
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordersWithProducts}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6a6a6a',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a4a4a',
    marginBottom: 4,
    lineHeight: 22,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6a6a6a',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6a6a6a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8a8a8a',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
