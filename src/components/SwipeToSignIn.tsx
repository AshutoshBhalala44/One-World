import { useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SwipeToSignInProps {
  label?: string;
  className?: string;
}

export function SwipeToSignIn({ label = "Swipe to sign in", className = "" }: SwipeToSignInProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [unlocked, setUnlocked] = useState(false);

  const THUMB = 56; // px
  const PADDING = 4; // track inner padding

  const getMaxX = () => {
    const w = trackRef.current?.offsetWidth ?? 320;
    return Math.max(0, w - THUMB - PADDING * 2);
  };

  const complete = () => {
    if (unlocked) return;
    setUnlocked(true);
    const max = getMaxX();
    animate(x, max, { duration: 0.18, ease: "easeOut" });
    setTimeout(() => navigate("/auth"), 350);
  };

  const handleDragEnd = () => {
    const max = getMaxX();
    if (x.get() >= max * 0.85) {
      complete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      complete();
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative w-full max-w-sm h-16 rounded-full bg-background/40 backdrop-blur-md border border-accent/40 shadow-lg overflow-hidden select-none ${className}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={handleKey}
    >
      {/* Fill that follows the thumb */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/30 to-accent/10"
        style={{ width: useTransformWidth(x, THUMB, PADDING) }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm sm:text-base font-medium text-foreground/80 tracking-wide">
          {unlocked ? "Unlocking…" : label}
        </span>
      </div>

      {/* Thumb */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: getMaxX() }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute top-1 left-1 h-14 w-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_24px_hsl(var(--accent)/0.6)] cursor-grab active:cursor-grabbing touch-none"
      >
        {unlocked ? <Check className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
      </motion.div>
    </div>
  );
}

// Helper to derive the fill width from thumb x
function useTransformWidth(x: any, thumb: number, padding: number) {
  const [w, setW] = useState(thumb + padding);
  // subscribe
  if (typeof window !== "undefined") {
    x.on?.("change", (v: number) => setW(thumb + padding + v));
  }
  return w;
}
