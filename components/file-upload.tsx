'use client';

import { useActionState, useState, useEffect } from 'react';
import { processAndStoreDocument } from '@/app/actions/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function FileUpload() {
  const [state, formAction, isPending] = useActionState(processAndStoreDocument, null);
  const [uploadStep, setUploadStep] = useState<string>('');

  useEffect(() => {
    if (!isPending) {
      return;
    }
    const timer1 = setTimeout(() => {
      setUploadStep('Uploading your file...');
    }, 2000);

    const timer2 = setTimeout(() => {
      setUploadStep('Reading through the file...');
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isPending]);

  const handleSubmit = (formData: FormData) => {
    setUploadStep('Processing the data...');
    formAction(formData);
  };
  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle>Upload File (Only allow .txt or .pdf files)</CardTitle>
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
        {state?.message && (
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
