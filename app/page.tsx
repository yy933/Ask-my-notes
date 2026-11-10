import HeroSection from '@/components/landing/hero-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import FeatureGridSection from '@/components/landing/feature-grid-section';
import CTASection from '@/components/landing/cta-section';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
        <HeroSection />
        <HowItWorksSection />
        <FeatureGridSection />
        <CTASection />
      </main>
    </div>
  );
}
