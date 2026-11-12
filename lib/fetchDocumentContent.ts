'use server';

import { createClient } from '@/lib/supabase/server';

export async function fetchFullDocumentContent(documentId: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized. Please log in.');
  }

  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('content')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .order('id', { ascending: true });

  if (error) {
    console.error('Failed to fetch document chunks:', error);
    throw new Error('Could not load document content.');
  }

  if (!chunks || chunks.length === 0) {
    return 'No content available for this document.';
  }

  // Combine all chunks and return the combined content
  return chunks.map((c) => c.content).join('\n\n');
}
