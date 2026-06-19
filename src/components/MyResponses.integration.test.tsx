import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ── Mock framer-motion (avoid animation gating) ──
vi.mock("framer-motion", () => {
  const R = require("react") as typeof import("react");
  const pass = (tag: string) =>
    R.forwardRef<HTMLElement, any>((props, ref) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props;
      return R.createElement(tag, { ref, ...rest });
    });
  return {
    motion: new Proxy({}, { get: (_t, p: string) => pass(p) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ── Mock recharts so YAxis category labels render as plain DOM ──
vi.mock("recharts", () => {
  const R = require("react") as typeof import("react");
  return {
    ResponsiveContainer: ({ children }: any) =>
      R.createElement("div", { "data-testid": "rc" }, children),
    BarChart: ({ data, children }: any) =>
      R.createElement(
        "div",
        { "data-testid": "bar-chart" },
        data.map((d: any) =>
          R.createElement("div", { key: d.name, "data-testid": "bar-row" }, d.name)
        ),
        children
      ),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  };
});

// ── Mock AuthContext (stable user reference to avoid effect loops) ──
vi.mock("@/contexts/AuthContext", () => {
  const user = { id: "user-1" };
  return { useAuth: () => ({ user }) };
});

// ── Mock supabase client with chainable builder ──
type TableData = Record<string, any[]>;
let tableData: TableData = {};
let rpcData: Record<string, any[]> = {};

function makeChain(rows: any[]) {
  const builder: any = {};
  const methods = ["select", "lt", "lte", "gt", "gte", "eq", "neq", "in", "order"];
  methods.forEach((m) => (builder[m] = () => builder));
  builder.then = (resolve: any, reject: any) =>
    Promise.resolve({ data: rows, error: null }).then(resolve, reject);
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeChain(tableData[table] ?? []),
    rpc: (name: string) => Promise.resolve({ data: rpcData[name] ?? [], error: null }),
  },
}));

import { MyResponses } from "./MyResponses";

const todayMinus = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
};

function setDailyFixture() {
  tableData = {
    polls: [
      {
        id: "p1",
        question: "Daily question one?",
        category: "tech",
        active_date: todayMinus(2),
        status: "approved",
      },
    ],
    votes: [],
    poll_options: [
      { id: "o1", label: "Yes", poll_id: "p1", sort_order: 1 },
      { id: "o2", label: "No", poll_id: "p1", sort_order: 2 },
    ],
    weekly_polls: [],
    weekly_votes: [],
    weekly_poll_options: [],
  };
  rpcData = {
    get_poll_vote_counts: [{ poll_id: "p1", option_id: "o1", vote_count: 50 }],
    get_weekly_vote_counts: [],
  };
}

function setGlobalFixture() {
  tableData = {
    polls: [],
    votes: [],
    poll_options: [],
    weekly_polls: [
      {
        id: "w1",
        question: "Global weekly question?",
        category: "world",
        week_start_date: todayMinus(14),
        end_date: todayMinus(8),
        status: "approved",
      },
    ],
    weekly_votes: [],
    weekly_poll_options: [
      { id: "wo1", label: "Option A", weekly_poll_id: "w1", sort_order: 1 },
      { id: "wo2", label: "Option B", weekly_poll_id: "w1", sort_order: 2 },
    ],
  };
  rpcData = {
    get_poll_vote_counts: [],
    get_weekly_vote_counts: [
      { weekly_poll_id: "w1", option_id: "wo1", vote_count: 100 },
    ],
  };
}

async function expandAndGetCountries() {
  // Wait for breakdown loading skeleton (800ms) to end and chart to be available
  const trigger = await screen.findByRole("button", { name: /Country Breakdown/i }, { timeout: 3000 });
  fireEvent.click(trigger);
  const chart = await screen.findByTestId("bar-chart", {}, { timeout: 3000 });
  const rows = within(chart).getAllByTestId("bar-row");
  return rows.map((r) => r.textContent || "");
}

describe("MyResponses + CountryBreakdownChart integration", () => {
  beforeEach(() => {
    cleanup();
    tableData = {};
    rpcData = {};
  });

  it("renders exactly 4 countries with USA pinned first for a Daily previous topic", async () => {
    setDailyFixture();
    render(
      <MemoryRouter>
        <MyResponses />
      </MemoryRouter>
    );

    await screen.findByText(/Daily question one\?/i);
    const labels = await expandAndGetCountries();

    expect(labels).toHaveLength(4);
    expect(labels[0]).toMatch(/USA/);
    // Other 3 must be non-USA and unique
    const others = labels.slice(1);
    expect(new Set(others).size).toBe(3);
    others.forEach((l) => expect(l).not.toMatch(/USA/));
  });

  it("renders exactly 4 countries with USA pinned first for a Global previous topic", async () => {
    setGlobalFixture();
    render(
      <MemoryRouter>
        <MyResponses />
      </MemoryRouter>
    );

    // Switch to Global tab
    const globalTab = await screen.findByRole("button", { name: /^Global$/i });
    fireEvent.click(globalTab);

    await screen.findByText(/Global weekly question\?/i);
    const labels = await expandAndGetCountries();

    expect(labels).toHaveLength(4);
    expect(labels[0]).toMatch(/USA/);
    const others = labels.slice(1);
    expect(new Set(others).size).toBe(3);
    others.forEach((l) => expect(l).not.toMatch(/USA/));
  });

  it("shows the empty breakdown state (no rows) when totalVotes is 0", async () => {
    setDailyFixture();
    rpcData.get_poll_vote_counts = []; // zero votes → MyResponses passes breakdowns=[]
    render(
      <MemoryRouter>
        <MyResponses />
      </MemoryRouter>
    );

    await screen.findByText(/Daily question one\?/i);
    const trigger = await screen.findByRole("button", { name: /Country Breakdown/i }, { timeout: 3000 });
    fireEvent.click(trigger);

    // Empty state message renders; no bar-chart rendered
    await screen.findByText(/Country breakdown data is not available/i);
    expect(screen.queryByTestId("bar-chart")).toBeNull();
  });
});
