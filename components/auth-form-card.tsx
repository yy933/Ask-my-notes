'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import type { AuthFormCardProps } from '@/types';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function AuthFormCard({
  title,
  subtitle,
  action,
  isPending,
  state,
  submitText,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthFormCardProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </CardHeader>

        <CardContent>
          <form action={action} className="space-y-4">
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

            {state && state.message && (
              <p
                className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-destructive'}`}
              >
                {state.message}
              </p>
            )}

            <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : submitText}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">{footerText}</span>
          <Link href={footerLinkHref} className="text-primary ml-1 font-medium hover:underline">
            {footerLinkText}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
