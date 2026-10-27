'use client';

import { useActionState, useState, useEffect } from 'react';
import { processAndStoreDocument } from '@/app/actions/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const UPLOAD_TIPS = [
  '☕ Fun Fact: The AI is hard at work reading your file. Grab a cup of coffee and relax!',
  '✨ Tip: Once uploaded, you can instantly ask questions about this document in the Chatbot page!',
  '🔍 Tip: Both .txt and .pdf files are supported for precise vector search.',
  '🤖 AI Whisper: "This document looks packed with some fascinating insights!"',
];

export default function FileUpload() {
  const [state, formAction, isPending] = useActionState(processAndStoreDocument, null);
  const [uploadStep, setUploadStep] = useState<string>('');

  useEffect(() => {
    if (!isPending) {
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % UPLOAD_TIPS.length;
      setUploadStep(UPLOAD_TIPS[index]);
    }, 3500); // texts change every 3.5s

    return () => {
      clearInterval(interval);
    };
  }, [isPending]);

  const handleSubmit = (formData: FormData) => {
    setUploadStep('Processing the data...');
    formAction(formData);
  };
  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle>Only allow .txt or .pdf files (Max: 3MB).</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <input
            type="file"
            name="file"
            accept=".txt,.pdf"
            disabled={isPending}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upload your file'
            )}
          </Button>
        </form>
        {isPending && (
          <div className="bg-muted/50 mt-4 animate-pulse rounded-lg border p-3 text-center">
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
              {uploadStep || 'Processing the file...'}
            </p>
          </div>
        )}
        {!isPending && state?.message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
              state.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            }`}
          >
            {state.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
