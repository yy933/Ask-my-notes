/**
 * @deprecated This module-level singleton Supabase client is NOT session-aware and
 * bypasses Row Level Security (RLS) when used in Server Actions or Route Handlers.
 *
 * All server-side code MUST use `createClient()` from '@/lib/supabase/server' instead,
 * which binds to the current request's cookies and enforces `auth.uid() = user_id`
 * RLS policies under the authenticated user's session.
 *
 * Do not import or use this file in new code. It is retained only for backward
 * compatibility with existing client-side usages that do not require RLS context.
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
