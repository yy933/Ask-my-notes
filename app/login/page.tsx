'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import { useAuth } from '@/providers/AuthProvider';
import { loginAction } from '@/app/actions/auth';
import { AuthFormCard } from '@/components/auth-form-card';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const { handleGoogleLogin, isGooglePending } = useGoogleLogin();
  const router = useRouter();

  const { refreshUser } = useAuth();
  useEffect(() => {
    if (state?.success) {
      // Once logged in, refresh auth status and redirect to /documents
      refreshUser().then(() => {
        router.refresh();
        router.replace('/documents');
      });
    }
  }, [state, router, refreshUser]);

  return (
    <AuthFormCard
      title="Welcome Back!"
      subtitle="Sign in to your AskMyNotes account"
      action={formAction}
      handleGoogleLogin={handleGoogleLogin}
      isPending={isPending || isGooglePending}
      state={state}
      submitText="Sign In"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/register"
    />
  );
}
