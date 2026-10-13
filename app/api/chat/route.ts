import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { searchSimilarChunks } from '@/lib/retrieval';

export async function POST(req: Request) {
  try {
    // Get the latest message from the request body

    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return NextResponse.json({ error: 'No message content provided' }, { status: 400 });
    }
    // 1. Search for relevant chunks based on the latest message and get Top 3-5 results

    const relevantChunks = await searchSimilarChunks(latestMessage, 4, 0.4);

    // 2. Merge the relevant chunks into a single string to provide context for the AI model
    const contextText = relevantChunks
      .map((chunk, index) => {
        return `[Source ${index + 1}] (File: ${chunk.metadata?.fileName || 'Unknown'})\n${chunk.content}`;
      })
      .join('\n\n');

    // 3. RAG System Prompt: Provide the context and the latest message to the AI model for generating a response
    const systemInstruction =
      `You are a professional assistant that provides accurate and concise answers based on the provided context. Use the context to answer the user's question. If the context does not contain relevant information, respond with "I couldn't find relevant information in the provided context." Do not make up answers. Answer in a clear and concise manner, and quote the relevant parts from the context where applicable.(For example, [Source 1])
    Provided context: ${contextText || 'No relevant context found.'}
    `.trim();

    // 4. Generate a streaming response using the Gemini API
    const response = await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-lite',
      contents: messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction,
        temperature: 0.3,
      },
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
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in chat API:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
