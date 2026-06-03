import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { SwipeToSignIn } from "@/components/SwipeToSignIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, Trophy, Vote, Globe2, ShieldCheck, BarChart3, Sparkles, ArrowRight, Heart } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DonationCheckoutDialog } from "@/components/DonationCheckoutDialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { isPaymentsConfigured } from "@/lib/stripe";
import heroImage from "@/assets/hero-globe.jpg";

const faqs = [
  { q: "What is One World?", a: "One World is a transparent global polling platform where verified people from 190+ countries answer Daily and Global Topics. Every result is broken down by country in real time — no aggregations hiding the truth." },
  { q: "How do you prevent bots and duplicate votes?", a: "Each account is tied to a verified phone number, enforcing one vote per person. Votes are stored anonymously, but identity verification keeps the results impossible to game." },
  { q: "Why do I have to complete the Global Topic first?", a: "The Global Topic is the platform's gate. By weighing in on the week's defining question, you unlock access to all Daily Topics and ensure every active voter has gone on the record for the week." },
  { q: "Where do the questions come from?", a: "Daily Topics and Global Topics are AI-curated for balance and reviewed by admins before publishing. You can also suggest your own from the Submit tab — top suggestions become real topics." },
  { q: "Is my vote private?", a: "Yes. Your individual vote is never tied to your phone number publicly. Only your country is associated with the result so we can show country-level breakdowns." },
  { q: "Is One World free?", a: "Yes — voting is completely free for everyone, everywhere." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const PRESET_AMOUNTS = [5, 25, 100];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutCents, setCheckoutCents] = useState<number>(0);

  const handleDonate = () => {
    if (!isPaymentsConfigured()) {
      toast.error("Payments are not configured for this build.");
      return;
    }
    const raw = customAmount.trim();
    let amount = 0;
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Please enter a valid donation amount.");
        return;
      }
      amount = parsed;
    } else if (selectedPreset) {
      amount = selectedPreset;
    } else {
      toast.error("Please choose or enter an amount.");
      return;
    }
    if (amount < 1) {
      toast.error("Minimum donation is $1.");
      return;
    }
    if (amount > 10000) {
      toast.error("For donations over $10,000, please contact us directly.");
      return;
    }
    setCheckoutCents(Math.round(amount * 100));
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <Helmet>
        <title>One World — What the World Actually Thinks</title>
        <meta name="description" content="Built to show what the world actually thinks — not what algorithms want you to believe. Verified voters from 190+ countries answer Daily Topics and Global Topics with real-time, country-level results." />
        <link rel="canonical" href="https://one-world.lovable.app/welcome" />
        <meta property="og:title" content="One World — What the World Actually Thinks" />
        <meta property="og:description" content="Built to show what the world actually thinks — not what algorithms want you to believe." />
        <meta property="og:url" content="https://one-world.lovable.app/welcome" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Header />
      <main>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-[hsl(45,100%,96%)]">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImage}
            alt="Glowing globe representing global participation"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
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
              Built to show what the world actually thinks — not what algorithms want you to believe. See where the world truly stands on the issues that matter.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs sm:text-sm opacity-70 mb-10">
              <span className="flex items-center gap-1.5">🌍 190+ countries</span>
              <span className="flex items-center gap-1.5">📊 Real-time results</span>
              <span className="flex items-center gap-1.5">🔒 Tamper-proof</span>
            </div>

            {user ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-foreground/80">Welcome back — you're already signed in.</p>
                <Button
                  size="lg"
                  onClick={() => navigate("/")}
                  className="bg-gold text-navy-deep hover:bg-gold/90 font-semibold gap-2 px-8 h-12 rounded-full shadow-lg"
                >
                  Enter the app
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <SwipeToSignIn />
                </div>
                <Link to="/auth" className="inline-block mt-4 text-xs text-foreground/60 hover:text-foreground underline-offset-4 hover:underline">
                  or sign in directly
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Support our mission */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-gold/30 bg-gradient-to-br from-navy-deep via-navy to-navy-deep p-8 sm:p-12 shadow-2xl"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,hsl(45,100%,60%/0.4),transparent_60%)]" />
          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 mb-4">
                <Heart className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-semibold tracking-wide text-gold uppercase">Support our mission</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[hsl(45,100%,96%)] mb-3">
                Keep every voice <span className="text-gradient-gold">heard, free, and unfiltered.</span>
              </h2>
              <p className="text-[hsl(45,100%,96%)]/75 leading-relaxed max-w-xl">
                One World is free for every voter, everywhere. Your donation funds phone verification, AI curation, and the infrastructure that keeps results tamper-proof — no ads, no investors, no agenda.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:min-w-[260px]">
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amount) => {
                  const active = selectedPreset === amount && !customAmount.trim();
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(amount);
                        setCustomAmount("");
                      }}
                      aria-pressed={active}
                      className={`px-3 py-3 rounded-xl border transition-colors font-display font-semibold ${
                        active
                          ? "border-gold bg-gold text-navy-deep"
                          : "border-gold/40 bg-gold/5 hover:bg-gold/15 text-[hsl(45,100%,96%)]"
                      }`}
                    >
                      ${amount}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(45,100%,96%)]/60 font-display">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step="1"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value.trim()) setSelectedPreset(null);
                  }}
                  className="pl-7 bg-[hsl(45,100%,96%)]/5 border-gold/30 text-[hsl(45,100%,96%)] placeholder:text-[hsl(45,100%,96%)]/40 focus-visible:ring-gold/40"
                  aria-label="Custom donation amount in US dollars"
                />
              </div>
              <Button
                size="lg"
                onClick={handleDonate}
                className="bg-gold text-navy-deep hover:bg-gold/90 font-semibold gap-2 h-12 rounded-full shadow-lg"
              >
                <Heart className="w-4 h-4 fill-navy-deep" />
                Donate
              </Button>
              <p className="text-[10px] text-[hsl(45,100%,96%)]/50 text-center">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <DonationCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        amountInCents={checkoutCents}
        userId={user?.id}
        customerEmail={user?.email}
      />

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three steps to add your voice to the global record.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Phone, title: "Verify your phone", body: "One vote per person. Quick, private OTP — no spam." },
            { icon: Trophy, title: "Complete the Global Topic", body: "Unlock the platform by weighing in on the week's defining question." },
            { icon: Vote, title: "Vote in Daily Topics", body: "Join fresh, AI-curated questions every day and watch results roll in live." },
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
              { icon: Sparkles, title: "AI-curated Topics", body: "Fresh, balanced questions every day, sourced and reviewed transparently." },
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

      {/* FAQ */}
      <section className="bg-card/30 border-y border-border py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know before you vote.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-display text-base sm:text-lg">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>One World — What the world actually thinks. Every voice matters.</p>
          <nav className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
