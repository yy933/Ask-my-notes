import FileUpload from '@/components/file-upload';
import { FileText } from 'lucide-react';

export default function Upload() {
  return (
    <div className="bg-background mx-auto flex h-screen w-full max-w-4xl flex-col p-4">
      <header className="mb-6 flex items-center justify-center border-b py-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
            <FileText className="text-primary h-6 w-6" />
            Upload Documents
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Import your documents, notes, or study materials into your personal vault.
          </p>
        </div>
      </header>
      <FileUpload />
    </div>
  );
}
