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
              className="group border-border/40 from-card/80 to-card/30 hover:border-primary/40 hover:shadow-primary/5 relative rounded-2xl border bg-gradient-to-b p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="via-primary/30 absolute inset-x-0 top-0 h-[1px] rounded-t-2xl bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="bg-primary/10 text-primary group-hover:bg-primary/20 mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105">
                <feature.icon className="h-5 w-5" />
              </div>

              <h3 className="group-hover:text-primary mb-2 text-lg font-bold transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
