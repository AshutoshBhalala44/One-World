import { describe, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

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
vi.mock("recharts", () => ({
  ResponsiveContainer: ({children}: any) => children,
  BarChart: ({data}: any) => React.createElement("div", {"data-testid":"bar-chart"}, JSON.stringify(data?.map((d:any)=>d.name))),
  Bar:()=>null, XAxis:()=>null, YAxis:()=>null, Tooltip:()=>null,
}));
vi.mock("@/contexts/AuthContext", () => {
  const user = { id: "user-1" };
  return { useAuth: () => ({ user }) };
});

function makeChain(rows:any[]){
  const b:any={};
  ["select","lt","lte","gt","gte","eq","neq","in","order"].forEach(m=>b[m]=()=>b);
  b.then=(r:any)=>Promise.resolve({data:rows,error:null}).then(r);
  return b;
}
const td:any={
  polls:[{id:"p1",question:"Q?",category:"t",active_date:"2025-01-01",status:"approved"}],
  votes:[], poll_options:[{id:"o1",label:"Y",poll_id:"p1",sort_order:1},{id:"o2",label:"N",poll_id:"p1",sort_order:2}],
  weekly_polls:[], weekly_votes:[], weekly_poll_options:[],
};
const rd:any={get_poll_vote_counts:[{poll_id:"p1",option_id:"o1",vote_count:50}],get_weekly_vote_counts:[]};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (t:string)=>makeChain(td[t]??[]),
    rpc: (n:string)=>Promise.resolve({data:rd[n]??[],error:null}),
  },
}));

import { MyResponses } from "./MyResponses";

describe("debug", ()=>{
  it("dbg", async ()=>{
    render(<MemoryRouter><MyResponses /></MemoryRouter>);
    await screen.findByText(/Q\?/);
    await new Promise(r=>setTimeout(r,1200));
    screen.debug(document.body, 80000);
  });
});
