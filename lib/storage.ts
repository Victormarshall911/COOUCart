import 'react-native-get-random-values';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';


const BUCKET = 'product-images';

export type UploadResult = {
  publicUrl: string;
  path: string;
};

export async function ensureBucketExists(): Promise<void> {
  // Supabase client cannot manage storage buckets from anon key.
  // Assume bucket exists; uploads will fail if not. Caller should configure bucket in dashboard.
  return;
}

export async function uploadImageFromUri(uri: string, ownerId: string): Promise<UploadResult> {
  const response = await fetch(uri);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();

  // Derive extension from content type to handle content:// URIs on Android
  const extFromType = (() => {
    if (contentType.includes('jpeg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('heic')) return 'heic';
    if (contentType.includes('heif')) return 'heif';
    return 'jpg';
  })();

  const fileName = `${ownerId}/${uuidv4()}.${extFromType}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, arrayBuffer, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { publicUrl: publicUrlData.publicUrl, path: data.path };
}


