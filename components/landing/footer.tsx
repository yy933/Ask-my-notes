import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-background border-t py-8">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs sm:flex-row sm:px-6">
        <div className="text-foreground flex items-center gap-2 font-semibold">
          <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-lg">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span>Ask My Notes</span>
        </div>
        <p>© {new Date().getFullYear()} Ask My Notes. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
