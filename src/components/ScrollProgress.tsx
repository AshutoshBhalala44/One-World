import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SectionInfo {
  id: string;
  label: string;
}
3:00 pm

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
    const sectionElements = SECTIONS.map((s) =>
      document.querySelector(`[data-section="${s.id}"]`)
    ).filter(Boolean) as Element[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section");
            const idx = SECTIONS.findIndex((s) => s.id === id);
            if (idx !== -1) {
              const scrollY = window.scrollY;
              setDirection(scrollY > lastScrollY.current ? "down" : "up");
              lastScrollY.current = scrollY;
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsVisible(docHeight > 200 && scrollTop > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
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
