import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { FormattedMessageProps } from '@/types';

export function FormattedMessage({ content, sources = [], onSelectSource }: FormattedMessageProps) {
  const parts = content.split(/(\[Source[^\]]+\])/g);

  return (
    <div className="leading-relaxed whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('[Source') && part.endsWith(']')) {
          const numbers = part.match(/\d+/g);

          if (!numbers) return <span key={index}>{part}</span>;

          return (
            <span
              key={index}
              className="mx-1 inline-flex flex-wrap items-center gap-1 align-baseline"
            >
              {numbers.map((num, numIdx) => {
                const sourceIndex = parseInt(num, 10) - 1;
                const sourceData = sources[sourceIndex];

                return (
                  <Badge
                    variant="secondary"
                    key={numIdx}
                    onClick={() => {
                      if (sourceData && onSelectSource) {
                        onSelectSource(sourceData);
                      }
                    }}
                    className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 inline-flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium transition-colors"
                    title={sourceData ? `View source: ${sourceData.title}` : `Source ${num}`}
                  >
                    <FileText className="h-3 w-3" />
                    Source {num}
                  </Badge>
                );
              })}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
