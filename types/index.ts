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
  document?: {
    title?: string;
    file_path?: string | null;
  };
};

export type Message = {
  role: 'user' | 'model';
  content: string;
  sources?: SourceItem[];
};

export type SourceItem = {
  id?: string;
  title: string;
  chunkIndex?: number;
  content: string;
  file_path?: string;
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
  raw_text?: string;
};

export type PreviewDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
};
