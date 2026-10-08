import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // Node.js runtime for testing, suitable for server-side code
    globals: true,
    // Exclude tests folder for E2E tests(Playwright)
    exclude: ['**/node_modules/**', '**/tests/**'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      // Support Next.js `@/` alias for imports
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
});
