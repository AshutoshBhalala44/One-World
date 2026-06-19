import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { ScrollProgress } from "./ScrollProgress";

const SECTION_IDS = ["hero", "how-it-works", "why", "donate", "team", "faq"];
const SECTION_HEIGHT = 800;
const VIEWPORT_HEIGHT = 800;

// Mock framer-motion to render plain DOM (no animation delays, no AnimatePresence gating)
vi.mock("framer-motion", () => {
  const React = require("react") as typeof import("react");
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, any>((props, ref) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return React.createElement(tag, { ref, ...rest });
    });
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, prop: string) => passthrough(prop),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

function setupSections() {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  container.style.position = "relative";
  SECTION_IDS.forEach((id, i) => {
    const el = document.createElement("section");
    el.setAttribute("data-section", id);
    el.setAttribute("data-test-index", String(i));
    container.appendChild(el);
  });
  document.body.appendChild(container);
  applyRects(0);
}

function applyRects(scrollY: number) {
  SECTION_IDS.forEach((id, i) => {
    const el = document.querySelector(`[data-section="${id}"]`) as HTMLElement;
    if (!el) return;
    const absoluteTop = i * SECTION_HEIGHT;
    const top = absoluteTop - scrollY;
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + SECTION_HEIGHT,
        left: 0,
        right: 1000,
        width: 1000,
        height: SECTION_HEIGHT,
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

function getActiveIndex(): number {
  const buttons = Array.from(document.querySelectorAll("button[aria-label^='Go to']"));
  return buttons.findIndex((btn) => btn.querySelector(".bg-accent"));
}

describe("ScrollProgress synchronization", () => {
  beforeEach(() => {
    setupSections();

    Object.defineProperty(window, "innerHeight", {
      value: VIEWPORT_HEIGHT,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: SECTION_IDS.length * SECTION_HEIGHT,
      writable: true,
      configurable: true,
    });

    // Run rAF synchronously so updates are deterministic.
    // Run rAF synchronously and return 0 so the component's "already scheduled"
    // guard (`if (rafId) return`) does not block subsequent scroll events.
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

  it("activates the section whose center is closest to the viewport center on scroll", () => {
    render(<ScrollProgress />);

    // Scroll deep enough to make the indicator visible (>80px) and land on section 2.
    act(() => scrollTo(2 * SECTION_HEIGHT));
    expect(getActiveIndex()).toBe(2);

    act(() => scrollTo(4 * SECTION_HEIGHT));
    expect(getActiveIndex()).toBe(4);
  });

  it("tracks the closest section during fast successive scroll events", () => {
    render(<ScrollProgress />);

    const positions = [0, 1, 2, 3, 4, 5].map((i) => i * SECTION_HEIGHT);
    act(() => {
      // Fire a burst of scroll events back-to-back, like a fast swipe.
      positions.forEach((y) => scrollTo(y));
    });
    expect(getActiveIndex()).toBe(5);

    // And back up just as fast (stop at section 1 so indicator stays visible)
    act(() => {
      [5, 4, 3, 2, 1].forEach((i) => scrollTo(i * SECTION_HEIGHT));
    });
    expect(getActiveIndex()).toBe(1);
  });

  it("responds to wheel events", () => {
    render(<ScrollProgress />);
    act(() => scrollTo(3 * SECTION_HEIGHT, "wheel"));
    expect(getActiveIndex()).toBe(3);
  });

  it("responds to touchmove events (mobile swipe)", () => {
    render(<ScrollProgress />);
    act(() => scrollTo(1 * SECTION_HEIGHT, "touchmove"));
    expect(getActiveIndex()).toBe(1);

    act(() => scrollTo(4 * SECTION_HEIGHT, "touchmove"));
    expect(getActiveIndex()).toBe(4);
  });

  it("snaps to the nearest section when stopping between two sections", () => {
    render(<ScrollProgress />);

    // 60% of the way between section 2 and 3 -> nearest is 3.
    act(() => scrollTo(2 * SECTION_HEIGHT + SECTION_HEIGHT * 0.6));
    expect(getActiveIndex()).toBe(3);

    // 30% of the way -> nearest is 2.
    act(() => scrollTo(2 * SECTION_HEIGHT + SECTION_HEIGHT * 0.3));
    expect(getActiveIndex()).toBe(2);
  });
});
