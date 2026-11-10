import { SearchCheck, Zap, ShieldCheck, FileCheck } from 'lucide-react';

const features = [
  {
    icon: SearchCheck,
    title: 'Source Citations Included',
    description:
      'Never worry about AI hallucinations. Every response comes with direct citations pointing to your original notes.',
  },
  {
    icon: Zap,
    title: 'Instant Document Retrieval',
    description:
      'Ask questions in plain English and receive real-time answers synthesized from across all your uploaded documents.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & Secure Storage',
    description:
      'Your notes belong strictly to you. All files and chats are securely stored and strictly isolated to your account.',
  },
  {
    icon: FileCheck,
    title: 'Supports Multiple Formats',
    description:
      'Seamlessly upload PDFs, text files, and markdown notes to build your personalized knowledge base.',
  },
];

export default function FeatureGridSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Master Your Reading
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            Built for students, researchers, and lifelong learners who want to read smarter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="border-border/40 bg-card/40 hover:bg-card hover:border-border/80 rounded-2xl border p-6 shadow-sm transition-all"
            >
              <div className="bg-primary/10 text-primary mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
