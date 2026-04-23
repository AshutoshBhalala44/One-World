import { motion } from "framer-motion";
import heroImage from "@/assets/hero-globe.jpg";
import { Header } from "@/components/Header";

const Badges = ({ size = "xs" }: { size?: "xs" | "sm" }) => (
  <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${size === "sm" ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"} opacity-70`}>
    <span className="flex items-center gap-1.5">🌍 190+ countries</span>
    <span className="flex items-center gap-1.5">📊 Real-time</span>
    <span className="flex items-center gap-1.5">🔒 Tamper-proof</span>
  </div>
);

const Headline = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const cls =
    size === "lg"
      ? "text-3xl sm:text-4xl md:text-6xl"
      : size === "md"
      ? "text-2xl sm:text-3xl md:text-4xl"
      : "text-xl sm:text-2xl md:text-3xl";
  return (
    <h1 className={`font-display ${cls} font-extrabold leading-tight mb-2 sm:mb-3`}>
      Every voice counts.
      <br />
      <span className="text-gradient-gold">No manipulation.</span>
    </h1>
  );
};

const Copy = () => (
  <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3 sm:mb-4 font-body">
    The world's most transparent polling platform. See where the world truly stands — broken down by country, in real time.
  </p>
);

const Frame = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-12">
    <div className="container mx-auto px-4 mb-3 flex items-center gap-3">
      <span className="font-display text-lg font-bold text-primary">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
    <div className="border-y border-border">{children}</div>
  </div>
);

/* A — Bottom-left glass card (current live version) */
const VariantA = () => (
  <section className="relative overflow-hidden bg-hero-gradient text-[hsl(45,100%,96%)]">
    <div className="absolute inset-0 opacity-30">
      <img src={heroImage} alt="" className="w-full h-full object-cover" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-tr from-navy-deep/70 via-transparent to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    <div className="relative container mx-auto px-4 min-h-[60vh] sm:min-h-[70vh] flex items-end py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md sm:max-w-lg rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-md p-5 sm:p-6 shadow-2xl"
      >
        <Headline size="md" />
        <Copy />
        <Badges />
      </motion.div>
    </div>
  </section>
);

/* B — Bottom-center ribbon */
const VariantB = () => (
  <section className="relative overflow-hidden bg-hero-gradient text-[hsl(45,100%,96%)]">
    <div className="absolute inset-0 opacity-35">
      <img src={heroImage} alt="" className="w-full h-full object-cover" />
    </div>
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-background/80 to-background" />
    <div className="relative min-h-[60vh] sm:min-h-[70vh] flex items-end">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 pb-8 sm:pb-12 text-center"
      >
        <Headline size="md" />
        <p className="text-sm sm:text-base opacity-80 max-w-2xl mx-auto mb-4 font-body">
          The world's most transparent polling platform — see where the world truly stands, in real time.
        </p>
        <div className="flex justify-center"><Badges /></div>
      </motion.div>
    </div>
  </section>
);

/* C — Side-by-side split */
const VariantC = () => (
  <section className="relative bg-hero-gradient text-[hsl(45,100%,96%)] overflow-hidden">
    <div className="container mx-auto px-4 py-10 sm:py-16 grid md:grid-cols-2 gap-8 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Headline size="lg" />
        <Copy />
        <Badges size="sm" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="relative aspect-square rounded-3xl overflow-hidden border border-foreground/10 shadow-2xl"
      >
        <img src={heroImage} alt="Global connectivity" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/40 to-transparent" />
      </motion.div>
    </div>
    <div className="h-12 bg-gradient-to-b from-transparent to-background" />
  </section>
);

/* D — Globe banner on top, text below */
const VariantD = () => (
  <section className="relative bg-background text-foreground">
    <div className="relative h-[40vh] sm:h-[45vh] overflow-hidden bg-hero-gradient">
      <img src={heroImage} alt="Global connectivity" className="w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 -mt-10 sm:-mt-16 relative pb-8 sm:pb-12 max-w-3xl"
    >
      <Headline size="lg" />
      <Copy />
      <Badges size="sm" />
    </motion.div>
  </section>
);

const HeroVariants = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold mb-1">Hero layout variants</h1>
        <p className="text-sm text-muted-foreground">
          Pick the one you like best and tell me the letter — I'll wire it up as the real homepage hero.
        </p>
      </div>

      <Frame label="Variant A — Bottom-left glass card (current live)"><VariantA /></Frame>
      <Frame label="Variant B — Bottom-center ribbon"><VariantB /></Frame>
      <Frame label="Variant C — Side-by-side split"><VariantC /></Frame>
      <Frame label="Variant D — Globe banner on top, text below"><VariantD /></Frame>
    </div>
  );
};

export default HeroVariants;
