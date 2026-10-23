import { supabase } from '@/lib/supabase';

export async function fetchFullDocumentContent(documentId: string): Promise<string> {
  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('content')
    .eq('document_id', documentId)
    .order('id', { ascending: true });

  if (error) {
    console.error('Failed to fetch document chunks:', error);
    throw new Error('Could not load document content.');
  }

  if (!chunks || chunks.length === 0) {
    return 'No content available for this document.';
  }

  // combine all the chunk and return the combined content
  return chunks.map((c) => c.content).join('\n\n');
}
