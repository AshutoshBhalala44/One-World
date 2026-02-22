import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PollCard } from "@/components/PollCard";
import { polls } from "@/data/polls";
import { motion } from "framer-motion";

const Index = () => {
  const [category, setCategory] = useState("all");

  const filtered = useMemo(
    () =>
      category === "all"
        ? polls
        : polls.filter((p) => p.category === category),
    [category]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-4 py-10">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Active Polls
          </h2>
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {/* Poll Grid */}
        <motion.div
          layout
          className="grid gap-6 md:grid-cols-2"
        >
          {filtered.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No polls in this category yet.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>One World — Transparent global polling. Every voice matters.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
