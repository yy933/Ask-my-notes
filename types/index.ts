export type Chunk = {
  content: string;
  chunkIndex: number;
};

export type ChunkSearchResult = {
  id: string;
  document_id: string;
  content: string;
  metadata: { chunkIndex: number; fileName: string };
  similarity: number;
};

export type Message = {
  role: 'user' | 'model';
  content: string;
};
