import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildDocumentIndex } from '@/app/actions/upload';
import type { DocumentItem } from '@/types';

export function useDocumentMutations(
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>,
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [buildingIds, setBuildingIds] = useState<Record<string, boolean>>({});
  const [notices, setNotices] = useState<Record<string, { success?: boolean; message?: string }>>(
    {}
  );

  // 1. Create AI index
  const handleBuilding = async (doc: DocumentItem) => {
    setBuildingIds((prev) => ({ ...prev, [doc.id]: true }));
    setNotices((prev) => ({ ...prev, [doc.id]: {} }));
    try {
      const res = await buildDocumentIndex(doc.id);
      setNotices((prev) => ({ ...prev, [doc.id]: res }));

      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'completed' } : d))
        );
      }
    } catch {
      setNotices((prev) => ({
        ...prev,
        [doc.id]: {
          success: false,
          message: 'Something went wrong while reading the file.',
        },
      }));
    } finally {
      setBuildingIds((prev) => ({ ...prev, [doc.id]: false }));
    }
  };

  // 2. Single document deletion
  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.title}?`)) {
      return;
    }

    try {
      setDeletingId(doc.id);

      if (doc.file_path) {
        const pathParts = doc.file_path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName]);
        }
      }

      const { error: docError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (docError) throw docError;

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setSelectedIds((prev) => prev.filter((id) => id !== doc.id));
      alert(`File ${doc.title} has been deleted!`);
    } catch (error) {
      console.error('Deletion failed:', error);
      alert('Failed to delete the document. Please try again later.');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    deletingId,
    buildingIds,
    notices,
    handleBuilding,
    handleDelete,
  };
}
