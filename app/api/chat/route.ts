import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { searchSimilarChunks } from '@/lib/retrieval';
import { retryWithBackoff } from '@/lib/utils';
import type { SourceItem } from '@/types';

export async function POST(req: Request) {
  try {
    // Get the latest message from the request body
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return NextResponse.json({ error: 'No message content provided' }, { status: 400 });
    }

    // 1. Search for relevant chunks based on the latest message and get Top 3-5 result
    const relevantChunks = await searchSimilarChunks(latestMessage, 4, 0.4);

    // 2. Merge the relevant chunks into a single string to provide context for the AI model
    const groupedSourcesMap = new Map<string, SourceItem>();

    relevantChunks.forEach((chunk) => {
      const docTitle = chunk.document?.title || chunk.metadata?.fileName || 'Unknown file';
      const filePath = chunk.document?.file_path || undefined;
      // file_path as the unique key. If file_path is not defined, use title insted
      const uniqueKey = filePath || docTitle;
      if (!groupedSourcesMap.has(uniqueKey)) {
        groupedSourcesMap.set(uniqueKey, {
          id: chunk.id,
          title: docTitle,
          chunkIndex: 1, // the first chunk from this doc
          content: chunk.content, // content of the first chunk
          file_path: filePath,
        });
      } else {
        // if the same doc has several chunks, combine the chunks as the content
        const existing = groupedSourcesMap.get(uniqueKey)!;
        existing.content += `\n\n... [Excerpt Continues] ...\n\n${chunk.content}`;
      }
    });

    const sourcesForClient: SourceItem[] = Array.from(groupedSourcesMap.values());

    const contextText = sourcesForClient
      .map((source, index) => {
        return `[Source ${index + 1}] (Document Title: ${source.title})\n${source.content}`;
      })
      .join('\n\n');

    // 3. RAG System Prompt: Provide the context and the latest message to the AI model for generating a response
    const systemInstruction = `
You are a helpful assistant. Answer the user's question accurately using ONLY the provided context. 
If you use information from a source document, cite it as [Source 1], [Source 2], etc.
If multiple points come from the same document, use the same [Source X] tag for that document.
If the answer cannot be found in the context, politely state that you cannot find relevant information in the uploaded documents.

Provided context:
${contextText || 'No relevant context found.'}
`.trim();

    // 4. Generate a streaming response using the Gemini API (Retry with backoff in case of 503 errors)
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents: messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
    });
    // 5. Stream the response back to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });
    // send source as custom header to frontend
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Chat-Sources': encodeURIComponent(JSON.stringify(sourcesForClient)),
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// (Only for UI tests)
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();
//     const latestMessage = messages[messages.length - 1]?.content;

//     if (!latestMessage) {
//       return NextResponse.json({ error: 'No message content provided' }, { status: 400 });
//     }

//     // 💡 暫時手動寫死測試用的字串（包含 [Source 1] 標籤）
//     const mockReply = `根據你的筆記，React 19 帶來了全新的 useActionState 鉤子 [Source 1]，能大幅簡化非同步表單狀態管理！`;

//     const encoder = new TextEncoder();
//     const readable = new ReadableStream({
//       async start(controller) {
//         // 模擬串流打字機效果，每 50ms 吐出一部分文字
//         for (let i = 0; i < mockReply.length; i += 3) {
//           const chunk = mockReply.slice(i, i + 3);
//           controller.enqueue(encoder.encode(chunk));
//           await new Promise((resolve) => setTimeout(resolve, 50));
//         }
//         controller.close();
//       },
//     });

//     return new Response(readable, {
//       headers: { 'Content-Type': 'text/plain; charset=utf-8' },
//     });
//   } catch (error) {
//     console.error('Error in mock chat API:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }
