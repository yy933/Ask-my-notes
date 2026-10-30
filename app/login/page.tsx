'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { AuthFormCard } from '@/components/auth-form-card';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <AuthFormCard
      title="Welcome Back!"
      subtitle="Sign in to your AskMyNotes account"
      action={formAction}
      isPending={isPending}
      state={state}
      submitText="Sign In"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/register"
    />
  );
}
