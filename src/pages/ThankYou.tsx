import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Share2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

interface DonationRecord {
  amount_cents: number;
  currency: string;
  status: string;
}

const ThankYou = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [donation, setDonation] = useState<DonationRecord | null>(null);
  const [polling, setPolling] = useState(true);

  // Webhook may take a beat — poll a few times before giving up.
  useEffect(() => {
    if (!sessionId) {
      setPolling(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const { data } = await supabase
        .from("donations")
        .select("amount_cents,currency,status")
        .eq("stripe_session_id", sessionId)
        .eq("environment", getStripeEnvironment())
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setDonation(data as DonationRecord);
        setPolling(false);
      } else if (attempts < 10) {
        setTimeout(tick, 1500);
      } else {
        setPolling(false);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const amountDisplay = donation ? `$${(donation.amount_cents / 100).toFixed(2)}` : null;
  const shareText = "I just supported One World — the world's most transparent polling platform. Add your voice:";
  const shareUrl = "https://one-world.lovable.app/welcome";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "One World", text: shareText, url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Thank you for supporting One World</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-gold" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
            Thank you{amountDisplay ? `,` : "!"}{" "}
            {amountDisplay && <span className="text-gradient-gold">{amountDisplay}</span>}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-2">
            Your support keeps every voice heard, free, and unfiltered.
          </p>
          {polling && !donation && (
            <p className="text-xs text-muted-foreground/70 mb-2">
              Confirming your payment…
            </p>
          )}
          {!polling && !donation && sessionId && (
            <p className="text-xs text-muted-foreground/70 mb-2">
              Your donation is processing. A receipt will be emailed to you.
            </p>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-gold text-navy-deep hover:bg-gold/90 font-semibold gap-2 rounded-full">
              <Link to="/">
                Vote in today's topic
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare} className="gap-2 rounded-full">
              <Share2 className="w-4 h-4" />
              Share One World
            </Button>
          </div>

          <div className="mt-12 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="w-3.5 h-3.5 text-gold" />
            <span>You're part of why this platform exists.</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ThankYou;
