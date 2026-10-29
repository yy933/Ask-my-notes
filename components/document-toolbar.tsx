'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DocumentToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
  onBatchDelete: () => void;
  isBatchDeleting: boolean;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function DocumentToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  isAllSelected,
  onBatchDelete,
  isBatchDeleting,
  sortBy,
  onSortChange,
}: DocumentToolbarProps) {
  return (
    <div className="bg-muted/40 mb-4 flex flex-col items-start justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isAllSelected && totalCount > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            disabled={isBatchDeleting}
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
          />
          <span>
            Select All ({selectedCount}/{totalCount})
          </span>
        </label>

        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBatchDelete}
            disabled={isBatchDeleting}
            className="cursor-pointer"
          >
            {isBatchDeleting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Selected ({selectedCount})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Sorting */}
      <div className="flex w-full items-center justify-end gap-2 text-sm sm:w-auto">
        <span className="text-muted-foreground text-xs">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-background focus:ring-primary rounded-md border px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none"
        >
          <option value="newest">Newest Uploaded</option>
          <option value="oldest">Oldest Uploaded</option>
          <option value="title">File Name (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
