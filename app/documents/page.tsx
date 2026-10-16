'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Trash2, Loader2, UploadCloud, Bot, Eye } from 'lucide-react';
import Link from 'next/link';
import type { DocumentItem } from '@/types';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // 2. 刪除檔案與同步清除向量機制 (Sync-Deletion)
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document and its AI index?')) {
      return;
    }

    try {
      setDeletingId(id);

      const { error: chunkError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', id);

      if (chunkError) console.warn('Error in deleting chunks: ', chunkError);

      const { error: docError } = await supabase.from('documents').delete().eq('id', id);

      if (docError) throw docError;

      // update UI state
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
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
      <header className="mb-6 flex items-center justify-between border-b py-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="text-primary h-6 w-6" />
            Knowledge Base Files
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your uploaded documents</p>
        </div>
        <Link
          className="hover:bg-muted mr-4 flex gap-2 rounded-full border p-3 md:rounded-lg"
          href="/chat"
        >
          <Bot className="text-primary h-6 w-6" />
          <span className="hidden md:inline-block">Ask Chatbot</span>
        </Link>
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

                <div className="flex items-center justify-end gap-2 border-t pt-3 md:border-t-0 md:pt-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer"
                    disabled={!doc.file_path}
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    Preview
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => handleDelete(doc.id)}
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
        )}
      </div>
    </div>
  );
}
