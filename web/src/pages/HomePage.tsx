import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { CategoryGrid } from '../components/CategoryGrid';
import { ForumSection } from '../components/ForumSection';
import { FeaturedListings } from '../components/FeaturedListings';
import { ChargingPreview } from '../components/ChargingPreview';
import { CommunityCta } from '../components/CommunityCta';
import { DiscoverSection } from '../components/DiscoverSection';
import { AppPromo } from '../components/AppPromo';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main>
        <Hero />
        <CategoryGrid />
        <ForumSection />
        <FeaturedListings />
        <ChargingPreview />
        <CommunityCta />
        <DiscoverSection />
        <AppPromo />
      </main>
      <Footer />
    </div>
  );
}
