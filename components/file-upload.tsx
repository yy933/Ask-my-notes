'use client';

import { useActionState, useState, useRef } from 'react';
import { uploadDocument } from '@/app/actions/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
  const [state, formAction, isPending] = useActionState(uploadDocument, null);
  const [hasNewFileSelected, setHasNewFileSelected] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleFileChange = () => {
    setHasNewFileSelected(true);
  };
  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle>Only allow .txt or .pdf files (Max: 3MB).</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={async (formData) => {
            setHasNewFileSelected(false);
            await formAction(formData);
          }}
          className="space-y-4"
        >
          <input
            type="file"
            name="file"
            accept=".txt,.pdf"
            disabled={isPending}
            onChange={handleFileChange}
            className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
          />
          <Button type="submit" disabled={isPending} className="w-full cursor-pointer">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload your file'
            )}
          </Button>
        </form>
        {/* response message from server */}
        {state?.message && !hasNewFileSelected && (
          <div className="mt-4 space-y-3">
            <p
              className={`text-center text-sm font-medium ${
                state.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              }`}
            >
              {state.message}
            </p>

            {/* Navigate to Documents List page after uploading files */}
            {state.success && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/documents')}
              >
                Check out your files <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
