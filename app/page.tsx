import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ActivityTicker from "@/components/ActivityTicker";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import BackgroundDecorations from "@/components/BackgroundDecorations";

export default function Home() {
  return (
    <div className="relative w-full text-orange-950">
      <BackgroundDecorations />
      <Navbar />
      <Hero />
      <ActivityTicker />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
}
