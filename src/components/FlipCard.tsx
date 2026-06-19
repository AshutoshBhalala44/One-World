import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Globe2, Vote } from "lucide-react";

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  frontLabel?: string;
  backLabel?: string;
}

/**
 * 3D flip card. Tap a side label or swipe horizontally to rotate
 * between the front (Global) and back (Daily) faces.
 */
export function FlipCard({
  front,
  back,
  frontLabel = "Global",
  backLabel = "Daily",
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  // Track the active face's height so the container animates smoothly
  // and the inactive (absolutely positioned) face never clips.
  useEffect(() => {
    const measure = () => {
      const el = flipped ? backRef.current : frontRef.current;
      if (el) setHeight(el.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (frontRef.current) ro.observe(frontRef.current);
    if (backRef.current) ro.observe(backRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [flipped]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x;
    const velocity = info.velocity.x;
    if (swipe < -60 || velocity < -400) setFlipped(true);
    else if (swipe > 60 || velocity > 400) setFlipped(false);
  };

  return (
    <div className="w-full">
      {/* Toggle pills */}
      <div className="flex justify-center mb-4">
        <div
          role="tablist"
          aria-label="Flip between Global and Daily topic"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 backdrop-blur-md p-1 shadow-sm"
        >
          <button
            role="tab"
            aria-selected={!flipped}
            onClick={() => setFlipped(false)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              !flipped
                ? "bg-accent text-accent-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            {frontLabel}
          </button>
          <button
            role="tab"
            aria-selected={flipped}
            onClick={() => setFlipped(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              flipped
                ? "bg-accent text-accent-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            {backLabel}
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/70 mb-3 select-none">
        Tap a label or swipe to flip
      </p>

      {/* 3D scene */}
      <motion.div
        className="relative w-full"
        style={{ perspective: 1800 }}
        animate={{ height }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full cursor-grab active:cursor-grabbing"
        >
          {/* Front face */}
          <div
            ref={frontRef}
            aria-hidden={flipped}
            className="w-full"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              position: flipped ? "absolute" : "relative",
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: flipped ? "none" : "auto",
            }}
          >
            {front}
          </div>

          {/* Back face */}
          <div
            ref={backRef}
            aria-hidden={!flipped}
            className="w-full"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: flipped ? "relative" : "absolute",
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: flipped ? "auto" : "none",
            }}
          >
            {back}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
