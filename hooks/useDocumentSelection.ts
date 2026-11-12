import { useState } from 'react';
import { deleteDocuments } from '@/app/actions/upload';
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

  // batch deletion (server-side ownership verification)
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(`Are you sure you want to delete ${selectedIds.length} selected documents?`)
    ) {
      return;
    }

    try {
      setIsBatchDeleting(true);

      const res = await deleteDocuments(selectedIds);

      if (!res.success) {
        alert(res.message || 'Failed to delete selected documents.');
        return;
      }

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
