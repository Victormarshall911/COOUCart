import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageFromUri } from '@/lib/storage';
import { Picker } from '@react-native-picker/picker';

export default function AddProductScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // new category modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role !== 'business') {
      router.replace('/(tabs)');
    }
  }, [profile]);

  // load categories from supabase
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (!error && data) {
        setCategories(data);
      } else {
        setCategories([
          { id: 'electronics', name: 'Electronics' },
          { id: 'clothing', name: 'Clothing' },
          { id: 'footwear', name: 'Footwear' },
          { id: 'books', name: 'Books' },
          { id: 'accessories', name: 'Accessories' },
        ]);
      }
    }
    fetchCategories();
  }, []);

  // create new category
  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      setError('Please enter a category name');
      return;
    }
    setError('');
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim() })
        .select()
        .single();

      if (error) throw error;

      // update local list and auto select
      setCategories((prev) => [...prev, data]);
      setSelectedCategory(data.id);
      setNewCategoryName('');
      setModalVisible(false);
    } catch (err) {
      console.error('Add category error:', err);
      setError('Failed to add category. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!title || !price || !selectedCategory) {
      setError('Please fill in all required fields');
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
        const upload = await uploadImageFromUri(localImageUri, profile.id);
        finalImageUrl = upload.publicUrl;
      }

      const { error: insertError } = await supabase.from('products').insert({
        title,
        description: description || null,
        price: priceNum,
        image_url: finalImageUrl,
        owner_id: profile!.id,
        category_id: selectedCategory,
      });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product. Please try again.');
    } finally {
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={styles.placeholder} />
      </View>

      {/* CONTENT */}
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

        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select category" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={16} color="#555" />
          <Text style={styles.addCategoryText}>Add New Category</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Product Image *</Text>
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.preview} />
        ) : null}

        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={handlePickImage}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Pick from device</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Product'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ADD CATEGORY MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#4a4a4a' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#4a4a4a' },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d8d8d8',
  },
  textArea: { height: 100, paddingTop: 16 },
  button: {
    backgroundColor: '#6a6a6a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#e8e8e8',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: { color: '#4a4a4a', fontSize: 14, fontWeight: '600' },
  error: {
    color: '#8a8a8a',
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#e8e8e8',
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
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    marginBottom: 12,
  },
  picker: { height: 50, color: '#333' },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 20,
  },
  addCategoryText: { color: '#555', fontSize: 14, fontWeight: '600' },

  // modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: '#eee' },
  saveButton: { backgroundColor: '#6a6a6a' },
  cancelText: { color: '#333', fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '600' },
});
