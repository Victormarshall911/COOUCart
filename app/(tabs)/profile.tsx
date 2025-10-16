import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Briefcase, ShoppingBag, LogOut, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [productCount, setProductCount] = useState(0);
  const [avgStars, setAvgStars] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);

  useEffect(() => {
    if (profile?.role === 'business') {
      loadProductCount();
      loadRatings();
    }
  }, [profile]);

  async function loadProductCount() {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profile!.id);

      if (error) throw error;
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error loading product count:', error);
    }
  }

  async function loadRatings() {
    try {
      const { data, count, error } = await supabase
        .from('ratings')
        .select('stars', { count: 'exact' })
        .eq('business_id', profile!.id);

      if (error) throw error;
      const stars = (data || []).map(r => (r as any).stars as number);
      const total = stars.reduce((a, b) => a + b, 0);
      const avg = stars.length ? total / stars.length : null;
      setAvgStars(avg);
      setRatingsCount(count || 0);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  }

  const roleColor = profile?.role === 'business' ? '#007AFF' : '#34C759';
  const roleIcon = profile?.role === 'business' ? Briefcase : ShoppingBag;
  const RoleIcon = roleIcon;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
          <User size={48} color={roleColor} />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
          <RoleIcon size={16} color="#fff" />
          <Text style={styles.roleText}>
            {profile?.role === 'business' ? 'Business' : 'Customer'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <User size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <RoleIcon size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>
                {profile?.role === 'business' ? 'Business Account' : 'Customer Account'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {profile?.role === 'business' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Stats</Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{productCount}</Text>
              <Text style={styles.statLabel}>Products Listed</Text>
            </View>
            <View style={[styles.statItem, { marginTop: 16 }] }>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Star size={20} color={avgStars ? '#f5a623' : '#ccc'} fill={avgStars ? '#f5a623' : 'none'} />
                <Text style={styles.statValue}>{avgStars ? avgStars.toFixed(1) : '—'}</Text>
              </View>
              <Text style={styles.statLabel}>{ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-product')}
          >
            <ShoppingBag size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add New Product</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ff3b30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Marketplace App v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
  signOutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
