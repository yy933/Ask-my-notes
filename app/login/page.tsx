'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <p className="text-muted-foreground text-sm">Sign in to your AskMyNotes account</p>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@askmynotes.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>

            {state && !state.success && (
              <p className="text-destructive text-sm font-medium">{state.message}</p>
            )}

            <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account?</span>
          <Link href="/register" className="text-primary ml-1 font-medium hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
