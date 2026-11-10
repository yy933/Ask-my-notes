'use client';

import { useTransition } from 'react';
import { signInWithGoogle } from '@/app/actions/auth';

export function useGoogleLogin() {
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      try {
        await signInWithGoogle();
      } catch (error) {
        if ((error as Error).message !== 'NEXT_REDIRECT') {
          console.error('Google login/registration failed', error);
        }
      }
    });
  };

  return {
    handleGoogleLogin,
    isGooglePending,
  };
}
