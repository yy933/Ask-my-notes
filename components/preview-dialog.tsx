'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import type { PreviewDialogProps } from '@/types';

export default function PreviewDialog({
  isOpen,
  onOpenChange,
  title,
  content,
}: PreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <FileText className="text-primary h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>Original File Content Preview</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 mt-4 flex-1 overflow-y-auto rounded-md border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {content || 'No content available.'}
        </div>
      </DialogContent>
    </Dialog>
  );
}
