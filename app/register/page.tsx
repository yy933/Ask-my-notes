'use client';

import { useActionState } from 'react';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import { registerAction } from '@/app/actions/auth';
import { AuthFormCard } from '@/components/auth-form-card';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const { handleGoogleLogin, isGooglePending } = useGoogleLogin();

  return (
    <AuthFormCard
      title="Create an Account"
      subtitle="Start building your personal knowledge base"
      action={formAction}
      handleGoogleLogin={handleGoogleLogin}
      isPending={isPending || isGooglePending}
      state={state}
      submitText="Sign Up"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    />
  );
}
