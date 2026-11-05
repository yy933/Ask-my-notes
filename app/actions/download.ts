'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDownloadUrl(filePath: string) {
  const supabase = await createClient();

  // 1. Check if the user has logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: 'Unauthorized' };
  }

  // 2. Get signed URL（expired in 60 seconds）
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);

  if (error || !data) {
    return { success: false, message: error?.message || 'Failed to generate download link' };
  }

  return { success: true, signedUrl: data.signedUrl };
}
