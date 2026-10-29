import { useState } from 'react';
import type { DocumentItem, SourceItem } from '@/types';
import { truncateContent } from '@/lib/truncateHelpers';

export function useDocumentPreview() {
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const contentLength = 450;

  const handlePreview = async (doc: DocumentItem) => {
    try {
      setIsPreviewLoading(true);

      setSelectedSource({
        id: doc.id,
        title: doc.title,
        content: doc.raw_text || 'No content available.',
        file_path: doc.file_path,
      });

      setIsPreviewModalOpen(true);
    } catch (error) {
      alert('Failed to load preview.');
      console.error('Failed to load preview: ', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const truncatedContent = truncateContent(selectedSource?.content, contentLength);

  return {
    selectedSource,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    isPreviewLoading,
    handlePreview,
    truncatedContent,
  };
}
