import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SectionInfo {
  id: string;
  label: string;
}

const SECTIONS: SectionInfo[] = [
  { id: "hero", label: "Welcome" },
  { id: "how-it-works", label: "How it works" },
  { id: "why", label: "Why One World" },
  { id: "donate", label: "Support us" },
  { id: "team", label: "Join the team" },
  { id: "faq", label: "FAQ" },
];

export function ScrollProgress() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((index: number) => {
    const sectionId = SECTIONS[index]?.id;
    if (!sectionId) return;
    const el = document.querySelector(`[data-section="${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const getSectionEls = () =>
      SECTIONS.map((s) => document.querySelector(`[data-section="${s.id}"]`)).filter(
        Boolean
      ) as HTMLElement[];

    let sectionElements = getSectionEls();
    if (sectionElements.length === 0) return;

    let rafId = 0;
    let lastY = window.scrollY;

    const update = () => {
      rafId = 0;
      const scrollY = window.scrollY;
      const viewportCenter = scrollY + window.innerHeight / 2;

      // Pick the section whose center is closest to the viewport center.
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < sectionElements.length; i++) {
        const rect = sectionElements[i].getBoundingClientRect();
        const center = scrollY + rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (scrollY !== lastY) {
        setDirection(scrollY > lastY ? "down" : "up");
        lastScrollY.current = scrollY;
        lastY = scrollY;
      }

      setActiveIndex((prev) => (prev === closestIdx ? prev : closestIdx));

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsVisible(docHeight > 200 && scrollY > 80);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    const onResize = () => {
      sectionElements = getSectionEls();
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Recompute once fonts/images settle.
    const settleTimeout = window.setTimeout(onResize, 400);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3"
      style={{ pointerEvents: "none" }}
    >
      <AnimatePresence>
        {isVisible &&
          SECTIONS.map((section, i) => {
            const isActive = i === activeIndex;
            const isHovered = i === hoveredIndex;
            const isNext =
              direction === "down" ? i === activeIndex + 1 : i === activeIndex - 1;

            return (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="relative flex items-center justify-end"
                style={{ pointerEvents: "auto" }}
                aria-label={`Go to ${section.label}`}
              >
                <AnimatePresence>
                  {(isActive || isHovered) && (
                    <motion.span
                      initial={{ opacity: 0, x: 8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="mr-2.5 text-[11px] font-medium tracking-wide whitespace-nowrap rounded-md px-2 py-1 bg-background/90 backdrop-blur-sm border border-border shadow-sm text-foreground"
                    >
                      {isNext && direction === "down" && (
                        <span className="text-muted-foreground mr-1">→</span>
                      )}
                      {isNext && direction === "up" && (
                        <span className="text-muted-foreground mr-1">←</span>
                      )}
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    scale: isActive ? 1.35 : isNext ? 1.15 : 1,
                    opacity: isActive ? 1 : isNext ? 0.65 : 0.35,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-2 h-2 rounded-full ${
                    isActive
                      ? "bg-accent shadow-[0_0_8px_hsl(40_95%_55%_/_0.5)]"
                      : isNext
                      ? "bg-foreground/50"
                      : "bg-foreground/25"
                  }`}
                />
              </motion.button>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
