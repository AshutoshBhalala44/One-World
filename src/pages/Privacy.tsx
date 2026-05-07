import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy — One World";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">What we collect</h2>
            <p>One World collects only what we need to keep voting honest: your phone number (for one-vote verification), your country (derived from that number), and the Challenges you vote on.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">How we use it</h2>
            <p>Your phone number is used solely to verify identity and enforce one vote per person. Your country is attached to your votes so we can show country-level breakdowns. We never sell your data.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Vote privacy</h2>
            <p>Individual votes are never publicly linked to your phone number. Public results show country-level aggregates only.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Your rights</h2>
            <p>You can request deletion of your account and associated votes at any time by contacting support.</p>
          </section>
        </div>

        <Link to="/welcome" className="inline-block mt-10 text-sm text-accent hover:underline">← Back to home</Link>
      </main>
    </div>
  );
};

export default Privacy;
