import { Upload, Cpu, MessageSquareQuote } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    step: 'Step 1',
    title: 'Upload Your Notes',
    description:
      'Import your documents, notes, or study materials into your personal vault in seconds.',
  },
  {
    icon: Cpu,
    step: 'Step 2',
    title: 'Feed Your Chatbot',
    description:
      'Our assistant automatically reads and organizes your files, getting ready to answer any questions about them.',
  },
  {
    icon: MessageSquareQuote,
    step: 'Step 3',
    title: 'Ask & Get Verified Insights',
    description:
      'Chat naturally with your notes to receive instant summaries and accurate answers back with clear page references.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-muted/20 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Ask My Notes Works</h2>
          <p className="text-muted-foreground mt-3 text-base">
            Get started in three effortless steps. No complex setup needed.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-card d border-border/50 relative flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
                {item.step}
              </span>
              <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
