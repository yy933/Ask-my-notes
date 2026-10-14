import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { FormattedMessageProps } from '@/types';

export function FormattedMessage({ content }: FormattedMessageProps) {
  const parts = content.split(/(\[Source \d+\])/g);

  return (
    <div className="leading-relaxed whitespace-pre-wrap">
      {parts.map((part, index) => {
        const match = part.match(/\[Source (\d+)\]/);

        if (match) {
          const sourceNum = match[1];
          return (
            <Badge
              key={index}
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 mx-1 inline-flex cursor-pointer items-center gap-1 text-xs font-normal transition-colors"
              title={`Reference ${sourceNum}`}
            >
              <FileText className="h-3 w-3" />
              Source {sourceNum}
            </Badge>
          );
        }

        // render the part as plain text if it doesn't match the source pattern
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </div>
  );
}
