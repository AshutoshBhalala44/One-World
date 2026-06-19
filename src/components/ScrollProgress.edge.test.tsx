import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { ScrollProgress } from "./ScrollProgress";

const SECTION_IDS = ["hero", "how-it-works", "why", "donate", "team", "faq"];
const DEFAULT_HEIGHT = 800;
const VIEWPORT_HEIGHT = 800;

vi.mock("framer-motion", () => {
  const React = require("react") as typeof import("react");
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, any>((props, ref) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return React.createElement(tag, { ref, ...rest });
    });
  return {
    motion: new Proxy({}, { get: (_t, prop: string) => passthrough(prop) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

let sectionHeight = DEFAULT_HEIGHT;
let totalSections = SECTION_IDS.length;

function setupSections(count = SECTION_IDS.length, height = DEFAULT_HEIGHT) {
  document.body.innerHTML = "";
  sectionHeight = height;
  totalSections = count;
  const container = document.createElement("div");
  SECTION_IDS.slice(0, count).forEach((id) => {
    const el = document.createElement("section");
    el.setAttribute("data-section", id);
    container.appendChild(el);
  });
  document.body.appendChild(container);
  applyRects(0);
  setDocHeight();
}

function setDocHeight() {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: totalSections * sectionHeight,
    writable: true,
    configurable: true,
  });
}

function applyRects(scrollY: number) {
  const ids = SECTION_IDS.slice(0, totalSections);
  ids.forEach((id, i) => {
    const el = document.querySelector(`[data-section="${id}"]`) as HTMLElement;
    if (!el) return;
    const top = i * sectionHeight - scrollY;
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + sectionHeight,
        left: 0,
        right: 1000,
        width: 1000,
        height: sectionHeight,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect);
  });
}

function scrollTo(y: number, eventType: "scroll" | "wheel" | "touchmove" = "scroll") {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
  applyRects(y);
  window.dispatchEvent(new Event(eventType));
}

function resizeViewport(height: number) {
  Object.defineProperty(window, "innerHeight", {
    value: height,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

function getActiveIndex(): number {
  const buttons = Array.from(document.querySelectorAll("button[aria-label^='Go to']"));
  return buttons.findIndex((btn) => btn.querySelector(".bg-accent"));
}

function getRenderedDotCount(): number {
  return document.querySelectorAll("button[aria-label^='Go to']").length;
}

describe("ScrollProgress edge cases", () => {
  beforeEach(() => {
    setupSections();
    Object.defineProperty(window, "innerHeight", {
      value: VIEWPORT_HEIGHT,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  describe("window resize mid-scroll", () => {
    it("recomputes active section after viewport height changes", () => {
      render(<ScrollProgress />);

      // Land on section 2 with an 800px viewport.
      act(() => scrollTo(2 * sectionHeight));
      expect(getActiveIndex()).toBe(2);

      // Shrink viewport drastically — center shifts upward but same section
      // should still be the closest.
      act(() => resizeViewport(300));
      expect(getActiveIndex()).toBe(2);

      // Now grow viewport hugely — the larger center reaches deeper, pulling
      // the active dot forward.
      act(() => {
        resizeViewport(2000);
        scrollTo(2 * sectionHeight);
      });
      // Viewport center is at 2*800 + 1000 = 2600 -> closest section is index 3 (center 2800).
      expect(getActiveIndex()).toBe(3);
    });

    it("recomputes active section when DOM sections are added after mount", () => {
      // Start with only 2 sections in the DOM.
      setupSections(2);
      Object.defineProperty(window, "innerHeight", {
        value: VIEWPORT_HEIGHT,
        writable: true,
        configurable: true,
      });

      render(<ScrollProgress />);
      act(() => scrollTo(1 * sectionHeight));
      expect(getActiveIndex()).toBe(1);

      // Add a third section after layout settles (simulates async content/route change).
      act(() => {
        const el = document.createElement("section");
        el.setAttribute("data-section", SECTION_IDS[2]);
        document.body.querySelector("div")?.appendChild(el);
        totalSections = 3;
        applyRects(window.scrollY);
        setDocHeight();
        window.dispatchEvent(new Event("resize"));
        scrollTo(2 * sectionHeight);
      });

      // The newly-added third section is now the active one.
      expect(getActiveIndex()).toBe(2);
    });

    it("stays in sync when resize fires between rapid scroll events", () => {
      render(<ScrollProgress />);

      act(() => {
        scrollTo(1 * sectionHeight);
        resizeViewport(600);
        scrollTo(3 * sectionHeight);
        resizeViewport(900);
        scrollTo(4 * sectionHeight);
      });

      expect(getActiveIndex()).toBe(4);
    });
  });

  describe("reduced-motion preference", () => {
    it("still synchronizes the indicator when prefers-reduced-motion is set", () => {
      // Force matchMedia('(prefers-reduced-motion: reduce)') to report true.
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: (query: string) => ({
          matches: query.includes("reduce"),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });

      render(<ScrollProgress />);

      act(() => scrollTo(1 * sectionHeight));
      expect(getActiveIndex()).toBe(1);

      act(() => scrollTo(4 * sectionHeight));
      expect(getActiveIndex()).toBe(4);
    });

    it("does not depend on smooth scroll animations to update the dot", () => {
      render(<ScrollProgress />);

      // Synchronous jumps emulate an instant `scroll-behavior: auto` jump
      // (what reduced-motion clients effectively see).
      act(() => scrollTo(5 * sectionHeight));
      expect(getActiveIndex()).toBe(5);
    });
  });

  describe("very short scroll containers", () => {
    it("hides the indicator when the page is shorter than the visibility threshold", () => {
      // Single tiny section -> docHeight ~= 0, never visible.
      setupSections(1, 200);
      Object.defineProperty(window, "innerHeight", {
        value: VIEWPORT_HEIGHT,
        writable: true,
        configurable: true,
      });

      render(<ScrollProgress />);
      act(() => scrollTo(50));
      expect(getRenderedDotCount()).toBe(0);
    });

    it("hides the indicator until the user scrolls past the top threshold", () => {
      setupSections(SECTION_IDS.length, DEFAULT_HEIGHT);
      render(<ScrollProgress />);

      act(() => scrollTo(40)); // below the 80px threshold
      expect(getRenderedDotCount()).toBe(0);

      act(() => scrollTo(200)); // above threshold
      expect(getRenderedDotCount()).toBeGreaterThan(0);
    });

    it("handles sections shorter than the viewport without skipping any", () => {
      // Sections half the viewport height — multiple fit on screen at once.
      setupSections(SECTION_IDS.length, 300);
      render(<ScrollProgress />);

      const centers = SECTION_IDS.map((_, i) => i * 300 + 150);
      centers.forEach((center, i) => {
        // Position so the section's center matches viewport center.
        const targetScroll = Math.max(100, center - VIEWPORT_HEIGHT / 2);
        act(() => scrollTo(targetScroll));
        if (targetScroll > 80) {
          expect(getActiveIndex()).toBe(i);
        }
      });
    });

    it("never returns an out-of-range active index, even at extreme scroll positions", () => {
      render(<ScrollProgress />);

      act(() => scrollTo(99999));
      const idx = getActiveIndex();
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(totalSections);
    });
  });
});
