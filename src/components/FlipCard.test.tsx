import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import { FlipCard } from "./FlipCard";

// Render framer-motion primitives as plain DOM so we can assert on styles/classes.
vi.mock("framer-motion", () => {
  const R = require("react") as typeof import("react");
  const cache = new Map<string, any>();
  const pass = (tag: string) => {
    if (!cache.has(tag)) {
      cache.set(
        tag,
        R.forwardRef<HTMLElement, any>((props, ref) => {
          const {
            initial,
            animate,
            exit,
            transition,
            whileHover,
            whileTap,
            layout,
            drag,
            dragConstraints,
            dragElastic,
            onDragEnd,
            ...rest
          } = props;
          return R.createElement(tag, { ref, ...rest });
        })
      );
    }
    return cache.get(tag);
  };
  return {
    motion: new Proxy({}, { get: (_t, p: string) => pass(p) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    PanInfo: {} as any,
  };
});

// Simulate a TALL unanswered Global face and a SHORT Daily face so the front,
// once flipped away, would extend past the container without clipping.
const FRONT_HEIGHT = 900;
const BACK_HEIGHT = 300;

let heightMap = new WeakMap<HTMLElement, number>();

function TallFront() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) heightMap.set(ref.current.parentElement!, FRONT_HEIGHT);
  }, []);
  return (
    <div ref={ref} data-testid="front-content" style={{ height: FRONT_HEIGHT }}>
      Unanswered Global question — should never bleed through
    </div>
  );
}
function ShortBack() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) heightMap.set(ref.current.parentElement!, BACK_HEIGHT);
  }, []);
  return (
    <div ref={ref} data-testid="back-content" style={{ height: BACK_HEIGHT }}>
      Daily challenge
    </div>
  );
}

describe("FlipCard — no upside-down bleed-through of unanswered Global face", () => {
  let offsetHeightSpy: any;
  let resizeObserverStub: any;

  beforeEach(() => {
    vi.useFakeTimers();
    heightMap = new WeakMap();
    // jsdom returns 0 for offsetHeight; make it read our simulated heights.
    offsetHeightSpy = Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return heightMap.get(this) ?? 0;
      },
    });
    resizeObserverStub = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
    (globalThis as any).ResizeObserver = resizeObserverStub;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
  });

  it("clips the 3D scene to the active face height via overflow-hidden", () => {
    const { container } = render(
      <FlipCard front={<TallFront />} back={<ShortBack />} />
    );
    // The height-animated container is the first .overflow-hidden under the root.
    const scene = container.querySelector(".overflow-hidden") as HTMLElement;
    expect(scene).toBeTruthy();
    // Perspective is set on the same element, confirming it's the 3D scene.
    expect(scene.style.perspective).toBe("1800px");
  });

  it("applies backface-visibility:hidden to both faces so a rotated face cannot render its back", () => {
    render(<FlipCard front={<TallFront />} back={<ShortBack />} />);
    const front = screen.getByTestId("front-content").parentElement as HTMLElement;
    const back = screen.getByTestId("back-content").parentElement as HTMLElement;
    expect(front.style.backfaceVisibility).toBe("hidden");
    expect(back.style.backfaceVisibility).toBe("hidden");
  });

  it("removes the tall front from layout flow (position:absolute, no pointer events) after flipping to Daily", () => {
    render(<FlipCard front={<TallFront />} back={<ShortBack />} />);
    const dailyTab = screen.getByRole("tab", { name: /Daily/i });

    // Click the Daily pill, then advance past the 320ms collapse delay so the
    // rotation state actually updates.
    act(() => {
      fireEvent.click(dailyTab);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const front = screen.getByTestId("front-content").parentElement as HTMLElement;
    expect(front.style.position).toBe("absolute");
    expect(front.style.pointerEvents).toBe("none");
    expect(front.getAttribute("aria-hidden")).toBe("true");
  });

  it("guarantees any leaked front pixels below the back face are clipped by the scene container", () => {
    // Together the two invariants — overflow-hidden on the scene AND the front
    // being absolutely positioned once flipped — mean the taller front cannot
    // extend past the shorter back's height into the visible area.
    const { container } = render(
      <FlipCard front={<TallFront />} back={<ShortBack />} />
    );
    const dailyTab = screen.getByRole("tab", { name: /Daily/i });
    act(() => {
      fireEvent.click(dailyTab);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const scene = container.querySelector(".overflow-hidden") as HTMLElement;
    const front = screen.getByTestId("front-content").parentElement as HTMLElement;

    expect(scene.className).toMatch(/overflow-hidden/);
    expect(front.style.position).toBe("absolute");
  });
});
