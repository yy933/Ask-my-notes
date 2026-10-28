'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Trash2,
  Loader2,
  Eye,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { DocumentItem } from '@/types';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { handleDownload } from '@/lib/fileDownload';

interface DocumentCardProps {
  doc: DocumentItem;
  isBuilding: boolean;
  isPreviewLoading: boolean;
  isDeleting: boolean;
  notice?: { success?: boolean; message?: string };
  onBuildIndex: (doc: DocumentItem) => void;
  onPreview: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export default function DocumentCard({
  doc,
  isBuilding,
  isPreviewLoading,
  isDeleting,
  notice,
  onBuildIndex,
  onPreview,
  onDelete,
}: DocumentCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-4 shadow-xs md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 md:items-center">
        <div className="bg-primary/10 shrink-0 rounded-lg p-2.5">
          <FileText className="text-primary h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm leading-none font-semibold">{doc.title}</h3>
          <p className="text-muted-foreground text-xs">
            Uploaded time: {new Date(doc.created_at).toLocaleString()}
          </p>

          {/* Document status */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {doc.status === 'completed' ? (
              <span className="flex items-center text-xs font-medium text-green-600">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Chatbot feeded!
              </span>
            ) : doc.status === 'failed' ? (
              <span className="text-destructive flex items-center text-xs font-medium">
                <AlertCircle className="mr-1 h-3.5 w-3.5" /> Feeding failed
              </span>
            ) : (
              <span className="flex items-center text-xs font-medium text-amber-600">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Ready to feed
              </span>
            )}
          </div>

          {/* Notice on creating index */}
          {notice?.message && (
            <p
              className={`text-xs font-medium ${notice.success ? 'text-green-600' : 'text-destructive'}`}
            >
              {notice.message}
            </p>
          )}
        </div>
      </div>

      {/* Button group */}
      <div className="flex items-center justify-end gap-2 border-t pt-3 md:border-t-0 md:pt-0">
        {doc.status !== 'completed' && (
          <Button
            size="sm"
            variant="default"
            className="cursor-pointer bg-violet-600 text-white hover:bg-violet-700"
            onClick={() => onBuildIndex(doc)}
            disabled={isBuilding}
          >
            {isBuilding ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin md:mr-1.5" />
                <span className="hidden md:inline">Feeding...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles className="h-4 w-4 md:mr-1.5" />
                <span className="hidden md:inline">Feed the chatbot</span>
              </div>
            )}
          </Button>
        )}

        <a
          onClick={() => onPreview(doc)}
          aria-disabled={!doc.file_path || isPreviewLoading}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'cursor-pointer md:px-3',
            (!doc.file_path || isPreviewLoading) && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex items-center justify-center">
            {isPreviewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin md:mr-1.5" />
            ) : (
              <Eye className="h-4 w-4 md:mr-1.5" />
            )}
            <span className="hidden md:inline">Preview</span>
          </div>
        </a>

        <a
          onClick={() => doc.file_path && handleDownload(doc.file_path, doc.title)}
          aria-disabled={!doc.file_path}
          className={cn(
            buttonVariants({ variant: 'default', size: 'sm' }),
            'cursor-pointer md:px-3',
            !doc.file_path && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex items-center justify-center">
            <Download className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">Download</span>
          </div>
        </a>

        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer md:px-3"
          onClick={() => onDelete(doc)}
          disabled={isDeleting}
        >
          <div className="flex items-center justify-center">
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 md:mr-1.5" />
                <span className="hidden md:inline">Delete</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </Card>
  );
}
