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

export type SourceItem = {
  id?: string;
  title: string;
  chunkIndex: number;
  content: string;
};

export type FormattedMessageProps = {
  content: string;
  sources?: SourceItem[];
  onSelectSource?: (source: SourceItem) => void;
};

export type DocumentItem = {
  id: string;
  title: string;
  created_at: string;
  file_path?: string;
};
