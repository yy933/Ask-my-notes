'use client';

import { useActionState } from 'react';
import { processAndStoreDocument } from '@/app/actions/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FileUpload() {
  const [state, formAction, isPending] = useActionState(processAndStoreDocument, null);

  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input
            type="file"
            name="file"
            accept=".txt,.pdf"
            disabled={isPending}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Processing...' : 'Start Parsing and Storing in Vector Database'}
          </Button>
        </form>
        {state?.message && <p className="mt-4 text-center text-sm font-medium">{state.message}</p>}
      </CardContent>
    </Card>
  );
}
