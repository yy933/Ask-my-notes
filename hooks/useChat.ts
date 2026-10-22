'use client';

import { useState, useActionState } from 'react';
import type { Message, SourceItem } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleChatAction = async (prevState: null | string, formData: FormData) => {
    const userMessageContent = (formData.get('userMessage') as string)?.trim();
    if (!userMessageContent) return null;

    // clear input field
    setInput('');

    // create updated message list
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];

    // update UI (add user question and empty AI bubble)
    setMessages([...updatedMessages, { role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error('API request failed');

      const sourceHeader = response.headers.get('X-Chat-Sources');
      let sources: SourceItem[] = [];
      if (sourceHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(sourceHeader));
          console.log('Frontend received sources: ', sources);
        } catch (error) {
          console.warn('Failed to parse X-Chat-Sources header', error);
        }
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Could not get reader from response body');

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: accumulatedText, sources };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: '⚠️ An error occurred, please try again later.' },
      ]);
    }

    return null;
  };

  const [state, formAction, isPending] = useActionState(handleChatAction, null);

  return {
    messages,
    input,
    setInput,
    formAction,
    isPending,
  };
}
