import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service — One World</title>
        <meta name="description" content="One World's terms of service: one account per person, acceptable use, and the rules that keep every Challenge honest." />
        <link rel="canonical" href="https://one-world.lovable.app/terms" />
        <meta property="og:title" content="Terms of Service — One World" />
        <meta property="og:description" content="One account per person, acceptable use, and the rules that keep every Challenge honest." />
        <meta property="og:url" content="https://one-world.lovable.app/terms" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Using One World</h2>
            <p>By creating an account you agree to participate honestly: one account per person, accurate country information, and no attempts to manipulate results.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Acceptable use</h2>
            <p>Don't use the platform to harass others, spread illegal content, or attempt to compromise the integrity of any Challenge. Suggested Challenges may be edited or rejected by moderators.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Account termination</h2>
            <p>We may suspend accounts that violate these terms or attempt to game results. You may delete your account at any time.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold mb-2">Disclaimer</h2>
            <p>One World is provided as-is. Results reflect verified participants only and should not be interpreted as scientific surveys.</p>
          </section>
        </div>

        <Link to="/welcome" className="inline-block mt-10 text-sm text-accent hover:underline">← Back to home</Link>
      </main>
    </div>
  );
};

export default Terms;
