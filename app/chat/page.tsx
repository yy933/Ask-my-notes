'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the bottom of the chat when new messages are added or when loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    setInput('');

    // 1. Update frontend conversation history (add user's question)
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setIsLoading(true);

    // 2. First, add an empty AI response bubble, ready to receive the streaming text
    setMessages((prev) => [...prev, { role: 'model', content: '' }]);

    try {
      // 3. Send request to our implemented /api/chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Could not get reader from response body');

      let accumulatedText = '';

      // 4. Read the ReadableStream character by character
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;

        // 5. Immediately update the last AI bubble's content (typewriter effect)
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: accumulatedText };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: '⚠️ An error occurred, please try again later.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background mx-auto flex h-screen max-w-5xl flex-col p-4">
      {/* Title */}
      <header className="mb-4 flex items-center justify-between border-b py-4">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Bot className="text-primary h-6 w-6" />
          Ask My Notes
        </h1>
      </header>

      {/* Message List Area */}
      <ScrollArea className="mb-4 flex-1 pr-4">
        <div className="space-y-4">
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
                className={`max-w-[80%] p-4 leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {msg.content || (
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
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
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your question..."
          className="max-h-[120px] min-h-[50px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !input.trim()} className="h-auto px-5">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
