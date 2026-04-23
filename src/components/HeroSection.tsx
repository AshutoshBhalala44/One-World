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
      {/* Subtle vignette so the corner card stays readable, but most of the globe stays clear */}
      <div className="absolute inset-0 bg-gradient-to-tr from-navy-deep/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />

      <div className="relative container mx-auto px-4 min-h-[60vh] sm:min-h-[70vh] flex items-end py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-md sm:max-w-lg rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-md p-5 sm:p-6 shadow-2xl"
        >
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-2 sm:mb-3">
            Every voice counts.
            <br />
            <span className="text-gradient-gold">No manipulation.</span>
          </h1>
          <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3 sm:mb-4 font-body">
            The world's most transparent polling platform. See where the world
            truly stands — broken down by country, in real time.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs opacity-70">
            <span className="flex items-center gap-1.5">🌍 190+ countries</span>
            <span className="flex items-center gap-1.5">📊 Real-time</span>
            <span className="flex items-center gap-1.5">🔒 Tamper-proof</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
