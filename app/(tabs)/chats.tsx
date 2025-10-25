import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle } from 'lucide-react-native';

type Chat = Database['public']['Tables']['chats']['Row'] & {
  products: {
    title: string;
    price: number;
  } | null;
  buyer_profile: {
    full_name: string | null;
  } | null;
  business_profile: {
    full_name: string | null;
  } | null;
};

export default function ChatsScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile?.id) {
      loadChats();
    }
  }, [profile]);

  async function loadChats() {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          products(title, price),
          buyer_profile:profiles!chats_buyer_id_fkey(full_name),
          business_profile:profiles!chats_business_id_fkey(full_name)
        `)
        .or(`buyer_id.eq.${profile!.id},business_id.eq.${profile!.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function renderChat({ item }: { item: Chat }) {
    const isBusiness = profile?.id === item.business_id;
    const otherPerson = isBusiness ? item.buyer_profile : item.business_profile;
    const statusColor = item.status === 'open' ? '#34C759' : '#999';

    const formatNaira = (value: number) => {
  if (isNaN(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};


    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.chatIcon}>
          <MessageCircle size={24} color="#007AFF" />
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {item.products?.title || 'Unknown Product'}
          </Text>
          <Text style={styles.chatSubtitle}>
            {isBusiness ? 'Buyer' : 'Seller'}: {otherPerson?.full_name || 'Unknown'}
          </Text>
          <Text style={styles.chatPrice}>
  {         formatNaira(item.products?.price || 0)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {item.status === 'open' ? 'Open' : 'Closed'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>
          {profile?.role === 'business' ? 'Your customer conversations' : 'Your purchase conversations'}
        </Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageCircle size={64} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            {profile?.role === 'business'
              ? 'Chats will appear when customers contact you'
              : 'Start a conversation by clicking "Buy Now" on a product'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadChats();
            }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  chatCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  chatPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
