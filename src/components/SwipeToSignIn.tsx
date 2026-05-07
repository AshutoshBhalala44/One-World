import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Globe2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SwipeToSignInProps {
  label?: string;
  className?: string;
}

/**
 * Globe Unlock swipe control.
 * Drag the rotating globe across the track. A glowing arc traces behind it.
 * On release past threshold, the globe scales up, spins, and the page transitions to /auth.
 */
export function SwipeToSignIn({ label = "Swipe the globe to enter", className = "" }: SwipeToSignInProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxX, setMaxX] = useState(280);
  const [unlocking, setUnlocking] = useState(false);

  const THUMB = 64;
  const PADDING = 4;

  useEffect(() => {
    const update = () => {
      const w = trackRef.current?.offsetWidth ?? 320;
      setMaxX(Math.max(0, w - THUMB - PADDING * 2));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Progress 0..1
  const progress = useTransform(x, [0, maxX], [0, 1]);
  const fillWidth = useTransform(progress, (p) => `${PADDING + THUMB / 2 + p * maxX}px`);
  const arcOpacity = useTransform(progress, [0, 1], [0.3, 1]);
  const labelOpacity = useTransform(progress, [0, 0.6], [1, 0]);
  const globeRotate = useTransform(progress, [0, 1], [0, 360]);
  const glowScale = useTransform(progress, [0, 1], [1, 1.4]);

  const complete = () => {
    if (unlocking) return;
    setUnlocking(true);
    animate(x, maxX, { duration: 0.25, ease: "easeOut" });
    setTimeout(() => navigate("/auth"), 950);
  };

  const handleDragEnd = () => {
    if (x.get() >= maxX * 0.8) {
      complete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      complete();
    }
  };

  return (
    <>
      <div
        ref={trackRef}
        className={`relative w-full max-w-md h-[72px] rounded-full select-none ${className}`}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={handleKey}
        style={{
          background:
            "radial-gradient(120% 120% at 0% 50%, hsl(var(--accent) / 0.15), transparent 60%), linear-gradient(180deg, hsl(var(--card) / 0.6), hsl(var(--background) / 0.4))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid hsl(var(--accent) / 0.35)",
          boxShadow:
            "inset 0 1px 0 hsl(var(--accent) / 0.15), 0 10px 40px -10px hsl(var(--accent) / 0.35), 0 0 0 1px hsl(var(--border) / 0.4)",
        }}
      >
        {/* World map ticks behind */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden opacity-40 pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, hsl(var(--accent) / 0.25) 0 1px, transparent 1px 14px), repeating-linear-gradient(0deg, hsl(var(--accent) / 0.12) 0 1px, transparent 1px 10px)",
              maskImage: "radial-gradient(ellipse at center, black 60%, transparent 100%)",
            }}
          />
        </div>

        {/* Glowing arc trail */}
        <motion.div
          className="absolute top-1 bottom-1 left-1 rounded-full pointer-events-none"
          style={{
            width: fillWidth,
            opacity: arcOpacity,
            background:
              "linear-gradient(90deg, hsl(var(--accent) / 0.0) 0%, hsl(var(--accent) / 0.35) 60%, hsl(var(--accent) / 0.85) 100%)",
            boxShadow: "0 0 30px hsl(var(--accent) / 0.6)",
          }}
        />

        {/* Label */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none pl-16"
          style={{ opacity: labelOpacity }}
        >
          <span className="text-sm sm:text-base font-medium tracking-wide text-foreground/85">
            {label}
          </span>
        </motion.div>

        {/* Outer pulse halo */}
        <motion.div
          aria-hidden
          className="absolute top-1 left-1 h-16 w-16 rounded-full pointer-events-none"
          style={{
            x,
            scale: glowScale,
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.5) 0%, transparent 65%)",
            filter: "blur(8px)",
          }}
        />

        {/* Globe Thumb */}
        <motion.div
          drag={unlocking ? false : "x"}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="absolute top-1 left-1 h-16 w-16 rounded-full cursor-grab active:cursor-grabbing touch-none"
        >
          <motion.div
            className="relative h-full w-full rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, hsl(var(--accent)) 0%, hsl(40 80% 40%) 60%, hsl(222 60% 12%) 100%)",
              boxShadow:
                "0 0 24px hsl(var(--accent) / 0.7), inset 0 0 16px hsl(0 0% 0% / 0.4), inset 2px 4px 10px hsl(var(--accent) / 0.4)",
            }}
            animate={unlocking ? { scale: [1, 1.15, 1.05], rotate: [0, 720] } : {}}
            transition={unlocking ? { duration: 0.9, ease: "easeOut" } : {}}
          >
            {/* Spinning meridians */}
            <motion.div
              className="absolute inset-0"
              style={{ rotate: globeRotate }}
              animate={unlocking ? { rotate: 720 } : undefined}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, transparent 0 7px, hsl(var(--accent-foreground) / 0.25) 7px 8px), repeating-linear-gradient(0deg, transparent 0 9px, hsl(var(--accent-foreground) / 0.18) 9px 10px)",
                  maskImage: "radial-gradient(circle, black 55%, transparent 75%)",
                }}
              />
            </motion.div>
            {/* Highlight */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 28% 25%, hsl(45 100% 90% / 0.55), transparent 40%)",
              }}
            />
            <Globe2 className="relative w-7 h-7 text-accent-foreground/90 drop-shadow" />
          </motion.div>
        </motion.div>
      </div>

      {/* Fullscreen transition flash */}
      <AnimatePresence>
        {unlocking && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Expanding gold globe */}
            <motion.div
              className="absolute left-1/2 top-1/2 rounded-full"
              initial={{ width: 80, height: 80, x: "-50%", y: "-50%", opacity: 0.9 }}
              animate={{ width: "260vmax", height: "260vmax", opacity: 1 }}
              transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--accent)) 0%, hsl(40 80% 35%) 35%, hsl(222 70% 8%) 70%)",
                boxShadow: "0 0 200px hsl(var(--accent) / 0.8)",
              }}
            />
            {/* Shimmer ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 rounded-full border-2"
              initial={{ width: 80, height: 80, x: "-50%", y: "-50%", opacity: 1 }}
              animate={{ width: "180vmax", height: "180vmax", opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              style={{ borderColor: "hsl(var(--accent) / 0.9)", boxShadow: "0 0 60px hsl(var(--accent))" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
