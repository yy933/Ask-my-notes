import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isValidNextPath(next: string | null): boolean {
  if (!next) return false;
  // Must be a relative path starting with "/" and not "//" (prevents protocol-relative open redirect)
  return next.startsWith('/') && !next.startsWith('//');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const redirectPath = isValidNextPath(next) ? next : '/documents';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Auth code exchange failed`);
}
