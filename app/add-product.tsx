import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageFromUri } from '@/lib/storage';

export default function AddProductScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role !== 'business') {
      router.replace('/(tabs)');
    }
  }, [profile]);

  async function handleSubmit() {
    if (!title || !price) {
      setError('Please fill in title and price');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!localImageUri) {
      setError('Please select a product image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalImageUrl = null as string | null;
      if (localImageUri && profile?.id) {
        try {
          const upload = await uploadImageFromUri(localImageUri, profile.id);
          finalImageUrl = upload.publicUrl;
        } catch (e: any) {
          console.error('Upload failed:', e);
          throw new Error(e?.message || 'Image upload failed');
        }
      }
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          title,
          description: description || null,
          price: priceNum,
          image_url: finalImageUrl,
          owner_id: profile!.id,
        });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product. Please try again.');
      setLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setLocalImageUri(asset.uri);
      }
    } catch (e) {
      console.error('Image pick error', e);
      setError('Failed to pick image');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Product Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter product name"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your product"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />

        <Text style={styles.label}>Price (₦) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Product Image *</Text>
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.preview} />
        ) : null}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity style={[styles.secondaryButton]} onPress={handlePickImage} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Pick from device</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Product'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
});
