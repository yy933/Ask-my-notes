'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import type { Message } from '@/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 1. Define Server/Client Action for handling chat messages
  const handleChatAction = async (prevState: null | string, formData: FormData) => {
    const userMessageContent = (formData.get('userMessage') as string)?.trim();
    if (!userMessageContent) return null;

    // Clear input field
    setInput('');

    // A. Creat chat history with latest user message
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    // B. Update frontend conversation history (add user's question and an empty AI response bubble)
    setMessages([...updatedMessages, { role: 'model', content: '' }]);

    try {
      // C. Call the chat API endpoint to get the AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Could not get reader from response body');

      let accumulatedText = '';

      // D. Read the ReadableStream character by character and update the last AI bubble's content (typewriter effect)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: accumulatedText };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages((prev) => {
        return [
          ...prev,
          { role: 'model', content: '⚠️ An error occurred, please try again later.' },
        ];
      });
    }
    return null; // Return null to indicate no specific state update is needed
  };
  // 2. Use the useActionState hook to manage the state of the chat action
  const [state, formAction, isPending] = useActionState(handleChatAction, null);
  // Automatically scroll to the bottom of the chat when new messages are added or when loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPending]);

  return (
    <div className="bg-background flex h-screen w-full justify-center p-4">
      <div className="flex h-full w-full max-w-4xl flex-col">
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
