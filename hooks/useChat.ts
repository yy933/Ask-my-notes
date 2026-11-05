'use client';

import { useState } from 'react';
import type { Message } from '@/types';

type ChatStatus = 'idle' | 'searching' | 'generating';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ChatStatus>('idle');

  // updated last response from chatbot
  const updateLast = (patch: Partial<Message>) =>
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...patch };
      return updated;
    });

  const sendMessage = async (e?: React.SubmitEvent) => {
    e?.preventDefault();

    const userMessageContent = input.trim();
    if (!userMessageContent || isLoading) return;

    setInput('');

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];

    // display user message right after submitting
    setMessages([...updatedMessages, { role: 'model', content: '' }]);
    setIsLoading(true);
    setStatus('searching');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok || !response.body) throw new Error('API request failed.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let accumulatedText = '';

      const handleEvent = (line: string) => {
        if (!line.trim()) return;

        let event;
        try {
          event = JSON.parse(line);
        } catch {
          console.warn('Failed to parse stream line:', line);
          return;
        }

        switch (event.type) {
          case 'status':
            setStatus(event.status);
            break;
          case 'sources':
            updateLast({ sources: event.sources });
            break;
          case 'text':
            setStatus('idle'); // The first word arrives. End thinking.
            accumulatedText += event.text;
            updateLast({ content: accumulatedText });
            break;
          case 'error':
            throw new Error(event.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // the last line might be incomplete. Save it for the next round.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) handleEvent(line);
      }

      buffer += decoder.decode();
      handleEvent(buffer);
    } catch (error) {
      console.error('Error in chat: ', error);
      updateLast({ content: 'An error occurred. Please try again later.' });
    } finally {
      setIsLoading(false);
      setStatus('idle');
    }
  };

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    status,
    isThinking: status !== 'idle',
  };
}
