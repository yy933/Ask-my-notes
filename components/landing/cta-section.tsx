import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="from-background via-muted/10 to-background bg-gradient-to-b py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="bg-card border-border/50 relative overflow-hidden rounded-3xl border p-8 shadow-sm sm:p-12">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start Exploring Today</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform the Way You Read?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
            Stop manually digging through hundreds of pages. Let Ask My Notes pull key answers for
            you in seconds.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/register">
              <Button size="lg" className="h-12 cursor-pointer gap-2 px-8 text-base shadow-md">
                <span>Try it now for free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
