'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { loginAction, signInWithGoogle } from '@/app/actions/auth';
import { AuthFormCard } from '@/components/auth-form-card';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [isGooglePending, startGoogleTransition] = useTransition();
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
  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      try {
        await signInWithGoogle();
      } catch (error) {
        if ((error as Error).message !== 'NEXT_REDIRECT') {
          console.error('Google login failed: ', error);
        }
      }
    });
  };
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
