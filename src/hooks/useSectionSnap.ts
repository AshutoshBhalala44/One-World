import { useEffect } from "react";

interface Options {
  /** CSS selector for the sections to snap between. */
  selector?: string;
  /** Minimum wheel delta / touch delta (px) that triggers a snap. */
  threshold?: number;
  /** Cool-down (ms) after a snap during which further gestures are ignored. */
  cooldownMs?: number;
  /** Enable/disable the hook. */
  enabled?: boolean;
}

/**
 * Snap-scroll controller.
 *
 * On wheel or touch gestures anywhere in the document, a small movement past
 * `threshold` immediately smooth-scrolls to the next (or previous) element
 * matching `selector`. Works in both directions.
 *
 * For sections taller than the viewport, the snap only fires once the user
 * has scrolled to that section's top/bottom edge — so long-form content
 * inside a tall section stays freely scrollable.
 */
export function useSectionSnap({
  selector = "[data-section]",
  threshold = 30,
  cooldownMs = 650,
  enabled = true,
}: Options = {}) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let isSnapping = false;
    let lastSnapAt = 0;
    let wheelAccum = 0;
    let wheelResetTimer: number | null = null;
    let touchStartY = 0;
    let touchStartTime = 0;
    let snapReleaseTimer: number | null = null;

    const getSections = () =>
      Array.from(document.querySelectorAll<HTMLElement>(selector));

    const currentIndex = (sections: HTMLElement[]) => {
      const anchor = window.scrollY + window.innerHeight * 0.35;
      let best = 0;
      let bestDist = Infinity;
      sections.forEach((s, i) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        const dist = Math.abs(top - anchor);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    const canSnapDown = (section: HTMLElement) => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Fits within viewport (with some tolerance) → always allow snap.
      if (rect.height <= vh * 1.1) return true;
      // Tall section → allow only once its bottom is near the viewport bottom.
      return rect.bottom <= vh + 60;
    };
    const canSnapUp = (section: HTMLElement) => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.height <= vh * 1.1) return true;
      return rect.top >= -60;
    };

    const snapTo = (index: number) => {
      const sections = getSections();
      const clamped = Math.max(0, Math.min(sections.length - 1, index));
      const target = sections[clamped];
      if (!target) return;
      isSnapping = true;
      lastSnapAt = Date.now();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (snapReleaseTimer) window.clearTimeout(snapReleaseTimer);
      snapReleaseTimer = window.setTimeout(() => {
        isSnapping = false;
      }, cooldownMs);
    };

    const attempt = (direction: 1 | -1) => {
      if (isSnapping) return;
      if (Date.now() - lastSnapAt < cooldownMs) return;
      const sections = getSections();
      if (sections.length === 0) return;
      const i = currentIndex(sections);
      const current = sections[i];
      if (direction === 1) {
        if (!canSnapDown(current)) return;
        if (i >= sections.length - 1) return;
        snapTo(i + 1);
      } else {
        if (!canSnapUp(current)) return;
        if (i <= 0) return;
        snapTo(i - 1);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Ignore horizontal-dominant wheels and pinch-zoom.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.ctrlKey) return;
      if (isSnapping) return;
      if (Date.now() - lastSnapAt < cooldownMs) return;

      wheelAccum += e.deltaY;
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccum = 0;
      }, 160);

      if (wheelAccum > threshold) {
        wheelAccum = 0;
        attempt(1);
      } else if (wheelAccum < -threshold) {
        wheelAccum = 0;
        attempt(-1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isSnapping) return;
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchStartTime = Date.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isSnapping) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - endY;
      const dt = Math.max(1, Date.now() - touchStartTime);
      const velocity = Math.abs(dy) / dt; // px per ms
      // Trigger on a modest distance OR a fast flick even if short.
      if (Math.abs(dy) < threshold && velocity < 0.5) return;
      attempt(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isSnapping) return;
      const target = e.target as HTMLElement | null;
      // Don't hijack keys while typing.
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "PageDown" || (e.key === "ArrowDown" && e.metaKey)) {
        e.preventDefault();
        attempt(1);
      } else if (e.key === "PageUp" || (e.key === "ArrowUp" && e.metaKey)) {
        e.preventDefault();
        attempt(-1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      if (snapReleaseTimer) window.clearTimeout(snapReleaseTimer);
    };
  }, [selector, threshold, cooldownMs, enabled]);
}
