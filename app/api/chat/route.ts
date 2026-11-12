import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/gemini';
import { searchSimilarChunks } from '@/lib/retrieval';
import { retryWithBackoff } from '@/lib/utils';
import { z } from 'zod';
import type { SourceItem } from '@/types';

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().min(1),
      })
    )
    .nonempty(),
});

export async function POST(req: Request) {
  // Authentication: verify user via Supabase Auth JWT
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Input validation with Zod
  let messages: { role: string; content: string }[];
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body: ' + parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    messages = parsed.data.messages;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const latestMessage = messages[messages.length - 1]?.content;
  if (!latestMessage) {
    return NextResponse.json({ error: 'No message content provided' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      // each event - JSON（NDJSON）
      const send = (event: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          // client disconnect
        }
      };

      try {
        send({ type: 'status', status: 'searching' });

        // 1. Search relevant chunks
        const relevantChunks = await searchSimilarChunks(latestMessage, 4, 0.4);

        // 2. Combine chunks based on documents
        const groupedSourcesMap = new Map<string, SourceItem>();

        relevantChunks.forEach((chunk) => {
          const docTitle = chunk.document?.title || chunk.metadata?.fileName || 'Unknown file';
          const filePath = chunk.document?.file_path || undefined;
          // file_path as unique key. If not exists, use title instead
          const uniqueKey = filePath || docTitle;

          if (!groupedSourcesMap.has(uniqueKey)) {
            groupedSourcesMap.set(uniqueKey, {
              id: chunk.id,
              title: docTitle,
              chunkIndex: 1,
              content: chunk.content,
              file_path: filePath,
            });
          } else {
            const existing = groupedSourcesMap.get(uniqueKey)!;
            existing.content += `\n\n... [Excerpt Continues] ...\n\n${chunk.content}`;
            if (!existing.file_path && filePath) {
              existing.file_path = filePath;
            }
          }
        });

        const sourcesForClient: SourceItem[] = Array.from(groupedSourcesMap.values());

        const contextText = sourcesForClient
          .map(
            (source, index) =>
              `[Source ${index + 1}] (Document Title: ${source.title})\n${source.content}`
          )
          .join('\n\n');

        // 3. RAG system prompt
        const systemInstruction = `
You are a helpful assistant. Answer the user's question accurately using ONLY the provided context. 
If you use information from a source document, cite it as [Source 1], [Source 2], etc.
If multiple points come from the same document, use the same [Source X] tag for that document.
If the answer cannot be found in the context, politely state that you cannot find relevant information in the uploaded documents.

Provided context:
${contextText || 'No relevant context found.'}
`.trim();

        // Searching done：send sources to client and then generating responses
        send({ type: 'sources', sources: sourcesForClient });
        send({ type: 'status', status: 'generating' });

        // 4. Call Gemini streaming（retry at 503）
        const response = await retryWithBackoff(async () => {
          return await ai.models.generateContentStream({
            model: 'gemini-3.1-flash-lite',
            contents: messages.map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }],
            })),
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });
        });

        // 5. send chunk texts
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) send({ type: 'text', text });
        }
      } catch (error) {
        console.error('Error in chat API:', error);
        send({
          type: 'error',
          message: 'Internal Server Error',
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already close
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
