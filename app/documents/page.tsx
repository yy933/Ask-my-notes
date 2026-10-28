'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buildDocumentIndex } from '../actions/upload';
import { Button } from '@/components/ui/button';
import PreviewDialog from '@/components/preview-dialog';
import DocumentCard from '@/components/document-card';
import DocumentToolbar from '@/components/document-toolbar';
import { FileText, Loader2, UploadCloud } from 'lucide-react';
import type { DocumentItem, SourceItem } from '@/types';
import { truncateContent } from '@/lib/truncateHelpers';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // document card related states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [buildingIds, setBuildingIds] = useState<Record<string, boolean>>({});
  const [notices, setNotices] = useState<Record<string, { success?: boolean; message?: string }>>(
    {}
  );
  const router = useRouter();

  // preview modal related states
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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

  // Preview
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

  // Building (Creating AI index)
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

  // Single Deletion
  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.title}?`)) {
      return;
    }

    try {
      setDeletingId(doc.id);

      // 1. if file path exists, delete files from Supabase Storage
      if (doc.file_path) {
        const pathParts = doc.file_path.split('/');
        const fileName = pathParts[pathParts.length - 1];

        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([fileName]);

          if (storageError) {
            console.warn('Error deleting file from storage:', storageError.message);
          }
        }
      }

      // 2. delete record from documents table
      const { error: docError } = await supabase.from('documents').delete().eq('id', doc.id);

      if (docError) throw docError;

      // 3. update UI state
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      alert(`File ${doc.title} has been deleted!`);
    } catch (error) {
      console.error('Deletion failed:', error);
      alert('Failed to delete the document. Please try again later.');
    } finally {
      setDeletingId(null);
    }
  };

  // Select toggle
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // select all / un-select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(documents.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Batch deletion
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(`Are you sure you want to delete ${selectedIds.length} selected documents?`)
    ) {
      return;
    }

    try {
      setIsBatchDeleting(true);

      // 1. Get selected docs（for deletion of files in Storage）
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

      // 2. remove from documents table
      const { error } = await supabase.from('documents').delete().in('id', selectedIds);
      if (error) throw error;

      // 3. update UI
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
              content={truncateContent(selectedSource?.content, 450)}
            />
          </>
        )}
      </div>
    </div>
  );
}
