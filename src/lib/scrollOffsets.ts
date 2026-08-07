/**
 * Shared scroll offsets.
 *
 * The app renders a sticky header (and, on the app shell, a fixed bottom nav)
 * that overlay page content. Any programmatic scroll must subtract the header
 * height, otherwise the target lands underneath the nav. Heights are measured
 * from the live DOM so the offset stays correct across breakpoints, dynamic
 * type sizes and layout changes — no hardcoded pixel guesses.
 */

const HEADER_SELECTOR = "[data-app-header], header[class*='sticky'], header[class*='fixed']";
const BOTTOM_NAV_SELECTOR = "[data-app-bottom-nav]";

function overlayHeight(selector: string): number {
  if (typeof document === "undefined") return 0;
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  let max = 0;
  for (const el of els) {
    if (!el.isConnected) continue;
    const pos = window.getComputedStyle(el).position;
    if (pos !== "fixed" && pos !== "sticky") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) continue;
    max = Math.max(max, rect.height);
  }
  return Math.round(max);
}

/** Height (px) of the sticky/fixed header currently overlaying the page. */
export function getHeaderOffset(): number {
  return overlayHeight(HEADER_SELECTOR);
}

/** Height (px) of the fixed bottom navigation, if one is mounted. */
export function getBottomNavOffset(): number {
  return overlayHeight(BOTTOM_NAV_SELECTOR);
}

/**
 * Top padding to use when aligning an element to the top of the viewport:
 * header height plus a small breathing gap.
 */
export function getTopSafeOffset(gap = 16): number {
  return getHeaderOffset() + gap;
}

/**
 * Bottom padding to use when aligning an element to the bottom of the
 * viewport: bottom-nav height plus a small breathing gap.
 */
export function getBottomSafeOffset(gap = 16): number {
  return getBottomNavOffset() + gap;
}

/**
 * Keeps `--app-header-h` / `--app-bottom-nav-h` on <html> in sync with the
 * live measured heights, so CSS (scroll-padding, scroll-margin) and JS scroll
 * math use the same numbers at every breakpoint. Returns a cleanup function.
 */
export function observeChromeOffsets(): () => void {
  if (typeof window === "undefined") return () => {};
  const root = document.documentElement;

  const sync = () => {
    root.style.setProperty("--app-header-h", `${getHeaderOffset()}px`);
    root.style.setProperty("--app-bottom-nav-h", `${getBottomNavOffset()}px`);
  };

  sync();

  const ro = new ResizeObserver(sync);
  const observed = new Set<Element>();
  const attach = () => {
    document
      .querySelectorAll(`${HEADER_SELECTOR}, ${BOTTOM_NAV_SELECTOR}`)
      .forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          ro.observe(el);
        }
      });
    sync();
  };
  attach();

  // The header/bottom nav mount and unmount with routes.
  const mo = new MutationObserver(attach);
  mo.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);

  return () => {
    ro.disconnect();
    mo.disconnect();
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", sync);
  };
}
