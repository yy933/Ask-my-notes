'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PreviewDialog from '@/components/preview-dialog';
import { FileText, Trash2, Loader2, UploadCloud, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import type { DocumentItem, SourceItem } from '@/types';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { handleDownload } from '@/lib/fileDownload';
import { truncateContent } from '@/lib/truncateHelpers';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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

  // 2. Sync-Deletion
  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
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

      // 2. delete record from document_chunks table
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', doc.id);

      if (chunkError) console.warn('Error in deleting chunks: ', chunkError);

      // 3. delete record from documents table
      const { error: docError } = await supabase.from('documents').delete().eq('id', doc.id);

      if (docError) throw docError;

      // 4. update UI state
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error('Deletion failed:', error);
      alert('Failed to delete the document. Please try again later.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-background mx-auto flex h-screen w-full max-w-4xl flex-col p-4">
      {/* Title */}
      <header className="mb-6 flex items-center justify-center border-b py-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="text-primary h-6 w-6" />
            Knowledge Base Files
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your uploaded documents</p>
        </div>
      </header>

      {/* Document List Area */}
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
            <Button className="mt-4" variant="outline">
              <Link href="/">Go to Upload</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="flex flex-col gap-4 p-4 shadow-xs md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3 md:items-center">
                    <div className="bg-primary/10 shrink-0 rounded-lg p-2.5">
                      <FileText className="text-primary h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm leading-none font-semibold">{doc.title}</h3>
                      <p className="text-muted-foreground text-xs">
                        Uploaded time: {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Button group: Preview, Download, Delete */}
                  <div className="flex items-center justify-end gap-2 border-t pt-3 md:border-t-0 md:pt-0">
                    <a
                      onClick={() => handlePreview(doc)}
                      aria-disabled={!doc.file_path || isPreviewLoading}
                      className={cn(
                        buttonVariants({ variant: 'secondary', size: 'sm' }),
                        'cursor-pointer',
                        (!doc.file_path || isPreviewLoading) && 'pointer-events-none opacity-50'
                      )}
                    >
                      {isPreviewLoading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-1.5 h-4 w-4" />
                      )}
                      Preview
                    </a>

                    {/* Download btn */}
                    <a
                      onClick={() =>
                        selectedSource?.file_path &&
                        handleDownload(selectedSource.file_path, selectedSource.title)
                      }
                      aria-disabled={!doc.file_path}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        !doc.file_path && 'pointer-events-none opacity-50'
                      )}
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Download
                    </a>

                    {/* Delete btn */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {/* Content preview dialog */}
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
