import { useState } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import type { DocumentItem } from '@/types';

export function useDocumentSelection(
  documents: DocumentItem[],
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Single select toggle
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select / un-select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(documents.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  // batch deletion
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(`Are you sure you want to delete ${selectedIds.length} selected documents?`)
    ) {
      return;
    }

    try {
      setIsBatchDeleting(true);

      // 1. Remove files from Supabase Storage
      const selectedDocs = documents.filter((d) => selectedIds.includes(d.id));
      for (const doc of selectedDocs) {
        if (doc.file_path) {
          const pathParts = doc.file_path.split('/');
          const fileName = pathParts[pathParts.length - 1];
          if (fileName) {
            await supabase.storage.from('documents').remove([fileName]);
          }
        }
      }

      // 2. Remove record from documents table
      const { error } = await supabase.from('documents').delete().in('id', selectedIds);
      if (error) throw error;

      // 3. Update UI
      setDocuments((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      setSelectedIds([]);
      alert('Selected documents have been deleted successfully!');
    } catch (error) {
      console.error('Batch deletion failed:', error);
      alert('Failed to delete selected documents. Please try again.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return {
    selectedIds,
    setSelectedIds,
    isBatchDeleting,
    handleSelectToggle,
    handleSelectAll,
    handleBatchDelete,
  };
}
