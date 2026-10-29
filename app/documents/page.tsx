'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import PreviewDialog from '@/components/preview-dialog';
import DocumentCard from '@/components/document-card';
import DocumentToolbar from '@/components/document-toolbar';
import { FileText, Loader2, UploadCloud } from 'lucide-react';
import type { DocumentItem } from '@/types';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { useDocumentPreview } from '@/hooks/useDocumentPreview';
import { useDocumentMutations } from '@/hooks/useDocumentMutations';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // document card related states
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  // Document selection custom hook
  const {
    selectedIds,
    setSelectedIds,
    isBatchDeleting,
    handleSelectToggle,
    handleSelectAll,
    handleBatchDelete,
  } = useDocumentSelection(documents, setDocuments);

  // Preview modal custom hook
  const {
    selectedSource,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    isPreviewLoading,
    handlePreview,
    truncatedContent,
  } = useDocumentPreview();

  // Document mutation (handle single document logic) custom hook
  const { deletingId, buildingIds, notices, handleBuilding, handleDelete } = useDocumentMutations(
    setDocuments,
    setSelectedIds
  );
  // 1. Get all documents
  useEffect(() => {
    let isMounted = true; // prevent setState after unmount

    async function loadDocuments() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) {
          const formattedData: DocumentItem[] = (data || []).map((doc) => ({
            ...doc,
            file_path: doc.file_path ?? undefined,
            status:
              doc.status === 'completed' || doc.status === 'failed' || doc.status === 'pending'
                ? doc.status
                : 'pending',
          }));
          setDocuments(formattedData);
        }
      } catch (error) {
        console.error('Fetching documents failed: ', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sorting documents
  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // pagination related variables
  const pageSize = 5;
  // 1. calculating total pages
  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // 2. calculating data range
  const startIndex = (currentPage - 1) * pageSize;
  const currentDocuments = sortedDocuments.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-background mx-auto flex h-screen w-full max-w-4xl flex-col p-4">
      <header className="mb-6 flex items-center justify-center border-b py-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="text-primary h-6 w-6" />
            Knowledge Base Files
          </h1>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            Manage your uploaded documents
          </p>
        </div>
      </header>
      <DocumentToolbar
        selectedCount={selectedIds.length}
        totalCount={sortedDocuments.length}
        onSelectAll={handleSelectAll}
        isAllSelected={sortedDocuments.length > 0 && selectedIds.length === sortedDocuments.length}
        onBatchDelete={handleBatchDelete}
        isBatchDeleting={isBatchDeleting}
        sortBy={sortBy}
        onSortChange={(value) => {
          setSortBy(value);
          setCurrentPage(1);
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-muted/30 rounded-xl border py-20 text-center">
            <UploadCloud className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No documents uploaded yet.</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Upload your files to start building your knowledge base.
            </p>
            <Button
              className="mt-4 cursor-pointer"
              variant="outline"
              onClick={() => router.push('/upload')}
            >
              Go to Upload
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {currentDocuments.map((doc) => {
                return (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedIds.includes(doc.id)}
                    isBuilding={buildingIds[doc.id] || false}
                    isPreviewLoading={isPreviewLoading}
                    isDeleting={deletingId === doc.id}
                    notice={notices[doc.id]}
                    onSelectToggle={handleSelectToggle}
                    onBuildIndex={handleBuilding}
                    onPreview={handlePreview}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground text-xs">
                Showing page {safeCurrentPage} of {totalPages} (Total {sortedDocuments.length}{' '}
                files)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>

            <PreviewDialog
              isOpen={isPreviewModalOpen}
              onOpenChange={setIsPreviewModalOpen}
              title={selectedSource?.title ?? ''}
              content={truncatedContent}
            />
          </>
        )}
      </div>
    </div>
  );
}
