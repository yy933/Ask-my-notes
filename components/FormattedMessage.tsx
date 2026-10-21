import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { truncateFileName } from '@/lib/truncateFileName';
import type { FormattedMessageProps, SourceItem } from '@/types';

export function FormattedMessage({ content, sources = [], onSelectSource }: FormattedMessageProps) {
  const parts = content.split(/(\[Source[^\]]+\])/g);
  console.log(parts);

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
                const targetNum = parseInt(num, 10) - 1;

                const sourceData: SourceItem | undefined =
                  sources.find((s) => s.chunkIndex === targetNum) ||
                  sources[targetNum - 1] ||
                  sources[0];

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
                    {truncateFileName(sourceData.title)}
                  </Badge>
                );
              })}
            </span>
          );
        }

        return (
          <ReactMarkdown
            key={index}
            components={{
              p: ({ children }) => <span>{children}</span>,
              ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4">{children}</ul>,
              ol: ({ children }) => (
                <ol className="my-2 list-decimal space-y-1 pl-4">{children}</ol>
              ),
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => (
                <strong className="text-foreground font-semibold">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="bg-muted-foreground/15 rounded px-1 py-0.5 font-mono text-xs">
                  {children}
                </code>
              ),
            }}
          >
            {part}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
