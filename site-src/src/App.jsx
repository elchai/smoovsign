import React, { useEffect } from 'react';
import { Header, Hero } from './components/Hero.jsx';
import { Bento, Audience, How, Pricing } from './components/Features.jsx';
import { Marquee, BigStats, ClientSection, Wordmark } from './components/Extras.jsx';
import { Security, Faq, Join, Footer, Floating } from './components/Closing.jsx';
import { bindPrepositions } from './lib/nb.js';

export default function App() {
  useEffect(() => bindPrepositions(document.getElementById('root')), []);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-white">דלגו לתוכן הראשי</a>
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <BigStats />
        <Bento />
        <Audience />
        <ClientSection />
        <How />
        <Pricing />
        <Security />
        <Faq />
        <Join />
      </main>
      <Wordmark />
      <Footer />
      <Floating />
    </>
  );
}
