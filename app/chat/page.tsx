'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { FormattedMessage } from '@/components/FormattedMessage';

export default function ChatPage() {
  const { messages, input, setInput, formAction, isPending } = useChat();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

            {messages.map((msg, index) => (
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
                      <FormattedMessage content={msg.content} />
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
            ))}
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
    </div>
  );
}
