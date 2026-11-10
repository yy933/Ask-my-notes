import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="from-background via-muted/30 to-background relative overflow-hidden bg-gradient-to-b py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Badge */}
        <div className="bg-background/80 text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
          <Sparkles className="text-primary h-3.5 w-3.5" />
          <span>Your Personal AI Knowledge Assistant</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Turn Your Notes into Instant <br className="hidden sm:inline" />
          <span className="from-primary via-primary/80 to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            Interactive Answers
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
          Upload your documents or notes, and chat directly with your customized AI assistant to get
          accurate answers with exact source references.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 w-full cursor-pointer gap-2 px-8 text-base shadow-md transition-all hover:shadow-lg sm:w-auto"
            >
              <span>Try it now</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full cursor-pointer px-8 text-base sm:w-auto"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Micro Value Prop */}
        <div className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Instant Document Search</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="text-primary h-4 w-4" />
            <span>Source Citations Included</span>
          </div>
        </div>
      </div>
    </section>
  );
}
