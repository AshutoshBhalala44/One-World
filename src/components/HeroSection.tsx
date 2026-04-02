import { motion } from "framer-motion";
import heroImage from "@/assets/hero-globe.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-[hsl(45,100%,96%)]">
      {/* Background image */}
      <div className="absolute inset-0 opacity-30">
        <img
          src={heroImage}
          alt="Global connectivity"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/60 via-navy/40 to-background" />

      <div className="relative container mx-auto px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            Every voice counts.
            <br />
            <span className="text-gradient-gold">No manipulation.</span>
          </h1>
          <p className="text-lg md:text-xl opacity-80 leading-relaxed mb-6 max-w-lg font-body">
            The world's most transparent polling platform. See where the world
            truly stands on the issues that matter — broken down by country, in real time.
          </p>
          <div className="flex items-center gap-4 text-sm opacity-60">
            <span className="flex items-center gap-1.5">🌍 190+ countries</span>
            <span className="flex items-center gap-1.5">📊 Real-time results</span>
            <span className="flex items-center gap-1.5">🔒 Tamper-proof</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
