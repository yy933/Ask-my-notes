import HeroSection from '@/components/landing/hero-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import FeatureGridSection from '@/components/landing/feature-grid-section';
import CTASection from '@/components/landing/cta-section';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <HowItWorksSection />
      <FeatureGridSection />
      <CTASection />
      <Footer />
    </main>
  );
}
