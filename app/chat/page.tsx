'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, FileText, BookOpen, Eye, Download } from 'lucide-react';
import { FormattedMessage } from '@/components/FormattedMessage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { truncateFileName, truncateContent } from '@/lib/truncateHelpers';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import type { SourceItem } from '@/types';

export default function ChatPage() {
  const { messages, input, setInput, formAction, isPending } = useChat();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleSelectSource = (source: SourceItem) => {
    setSelectedSource(source);
    setIsSheetOpen(true);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  return (
    <div className="bg-background flex h-screen w-full justify-center p-4">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        {/* Title */}
        <header className="mb-6 flex items-center justify-center border-b py-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold" data-testid="chat-header">
              <Bot className="text-primary h-6 w-6" />
              Ask Chatbot
            </h1>
          </div>
        </header>

        {/* Message List Area */}
        <ScrollArea className="mb-4 flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-muted-foreground py-20 text-center">
                <p>Hi there! How can I help you today?</p>
              </div>
            )}

            {messages.map((msg, index) => {
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'model' && (
                    <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Bot className="text-primary h-4 w-4" />
                    </div>
                  )}

                  <Card
                    data-testid={msg.role === 'user' ? 'user-message' : 'ai-message'}
                    className={`max-w-[80%] p-4 leading-relaxed ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {msg.content ? (
                      msg.role === 'model' ? (
                        <FormattedMessage
                          content={msg.content}
                          sources={msg.sources}
                          onSelectSource={handleSelectSource}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching notes & thinking...
                      </span>
                    )}
                  </Card>

                  {msg.role === 'user' && (
                    <div className="bg-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
            {/* Bottom ref */}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form ref={formRef} action={formAction} className="flex gap-2 border-t pt-2">
          <Textarea
            value={input}
            name="userMessage"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your question..."
            className="max-h-[120px] min-h-[50px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !input.trim()} className="h-auto px-5">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
      {/* Sheet (Check original chunk text) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="flex w-[350px] flex-col sm:w-[450px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" />
              Source Citation
            </SheetTitle>
            <SheetDescription>Original knowledge excerpt referenced by the AI.</SheetDescription>
          </SheetHeader>

          {selectedSource && (
            <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
              {/* Chunk source title */}
              <div className="bg-muted/50 mx-4 space-y-1 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="text-primary h-4 w-4 shrink-0" />
                  <span>{truncateFileName(selectedSource.title, 70)}</span>
                </div>
                {/* Preview and download btn group */}
                {selectedSource.file_path && (
                  <div className="flex items-center gap-2 border-t pt-2">
                    <a
                      rel="noopener noreferrer"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className={cn(
                        buttonVariants({ variant: 'secondary', size: 'sm' }),
                        'flex-1 cursor-pointer'
                      )}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Preview Original File
                    </a>

                    <a
                      href={selectedSource.file_path}
                      download={selectedSource.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'flex-1 cursor-pointer'
                      )}
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Download
                    </a>
                  </div>
                )}
              </div>

              {/* Original chunk text preview */}
              <div className="mx-4 space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Original Excerpt Content
                </h4>
                <div className="bg-card text-foreground/90 rounded-lg border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-2xs">
                  {truncateContent(selectedSource.content, 120)}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* Content preview dialog */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <FileText className="text-primary h-5 w-5" />
              {selectedSource?.title}
            </DialogTitle>
            <DialogDescription>Original File Content Preview</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 mt-4 flex-1 overflow-y-auto rounded-md border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {truncateContent(selectedSource?.content, 450)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
