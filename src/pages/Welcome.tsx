import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SwipeToSignIn } from "@/components/SwipeToSignIn";
import { Phone, Trophy, Vote, Globe2, ShieldCheck, BarChart3, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-globe.jpg";

const Welcome = () => {
  useEffect(() => {
    document.title = "One World — Transparent Global Challenges";
    const desc = "The world's most transparent polling platform. Join Daily and Weekly Challenges and see where the world truly stands.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-[hsl(45,100%,96%)]">
        <div className="absolute inset-0 opacity-30">
          <img src={heroImage} alt="Glowing globe representing global participation" className="w-full h-full object-cover" loading="eager" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/60 via-navy/40 to-background" />

        <div className="relative container mx-auto px-4 py-16 sm:py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-4 sm:mb-6">
              Every voice counts.
              <br />
              <span className="text-gradient-gold">No manipulation.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl opacity-80 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto font-body">
              The world's most transparent polling platform. See where the world truly stands on the issues that matter — broken down by country, in real time.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs sm:text-sm opacity-70 mb-10">
              <span className="flex items-center gap-1.5">🌍 190+ countries</span>
              <span className="flex items-center gap-1.5">📊 Real-time results</span>
              <span className="flex items-center gap-1.5">🔒 Tamper-proof</span>
            </div>

            <div className="flex justify-center">
              <SwipeToSignIn />
            </div>
            <Link to="/auth" className="inline-block mt-4 text-xs text-foreground/60 hover:text-foreground underline-offset-4 hover:underline">
              or sign in directly
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three steps to add your voice to the global record.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Phone, title: "Verify your phone", body: "One vote per person. Quick, private OTP — no spam." },
            { icon: Trophy, title: "Complete the Weekly Challenge", body: "Unlock the platform by weighing in on the week's defining question." },
            { icon: Vote, title: "Vote in Daily Challenges", body: "Join fresh, AI-curated questions every day and watch results roll in live." },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-card"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why One World */}
      <section className="bg-card/30 border-y border-border py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Why One World</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built for honesty in a world of noise.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Globe2, title: "Country-by-country breakdowns", body: "See exactly how each nation voted — no aggregations hiding the truth." },
              { icon: ShieldCheck, title: "One vote per person", body: "Phone-verified identity keeps the results impossible to game." },
              { icon: Sparkles, title: "AI-curated Challenges", body: "Fresh, balanced questions every day, sourced and reviewed transparently." },
              { icon: BarChart3, title: "Real-time global results", body: "Watch the world respond live, with full visibility into every percentage." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-background border border-border rounded-2xl p-6"
              >
                <f.icon className="w-7 h-7 text-accent mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to be counted?
          </h2>
          <p className="text-muted-foreground mb-8">Swipe below to sign in and join today's Challenge.</p>
          <div className="flex justify-center">
            <SwipeToSignIn />
          </div>
          <Link to="/auth" className="inline-block mt-4 text-sm text-foreground/60 hover:text-foreground underline-offset-4 hover:underline">
            or sign in directly
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>One World — Transparent global polling. Every voice matters.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
