import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface CountryData {
  country: string;
  flag: string;
  results: Record<string, number>;
}

interface OptionInfo {
  id: string;
  label: string;
}

const CHART_COLORS = [
  "hsl(222, 60%, 18%)",   // navy
  "hsl(40, 95%, 55%)",    // gold/accent
  "hsl(222, 40%, 30%)",   // navy-light
  "hsl(42, 100%, 70%)",   // gold-light
];

// Sample country breakdown data for demo purposes
const SAMPLE_BREAKDOWNS: CountryData[] = [
  { country: "United States", flag: "🇺🇸", results: {} },
  { country: "United Kingdom", flag: "🇬🇧", results: {} },
  { country: "India", flag: "🇮🇳", results: {} },
  { country: "Germany", flag: "🇩🇪", results: {} },
  { country: "Brazil", flag: "🇧🇷", results: {} },
  { country: "Japan", flag: "🇯🇵", results: {} },
];

function generateSampleData(options: OptionInfo[]): CountryData[] {
  // Generate pseudo-random but deterministic percentages per country
  const seeds = [0.35, 0.42, 0.28, 0.5, 0.38, 0.45];
  return SAMPLE_BREAKDOWNS.map((bd, cIdx) => {
    const results: Record<string, number> = {};
    let remaining = 100;
    options.forEach((opt, oIdx) => {
      if (oIdx === options.length - 1) {
        results[opt.id] = remaining;
      } else {
        const base = Math.round(100 / options.length);
        const variance = Math.round((seeds[(cIdx + oIdx) % seeds.length] - 0.4) * 30);
        const val = Math.max(5, Math.min(remaining - (options.length - oIdx - 1) * 5, base + variance));
        results[opt.id] = val;
        remaining -= val;
      }
    });
    return { ...bd, results };
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function CountryBreakdownChart({ options }: { options: OptionInfo[] }) {
  const [expanded, setExpanded] = useState(false);
  const breakdowns = generateSampleData(options);

  const chartData = breakdowns.map((bd) => {
    const row: Record<string, any> = { name: `${bd.flag} ${bd.country}` };
    options.forEach((opt) => {
      row[opt.label] = bd.results[opt.id] || 0;
    });
    return row;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-lg hover:bg-secondary/50"
      >
        🌍 Country Breakdown
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-secondary/30 p-4">
              <div className="w-full" style={{ height: breakdowns.length * 56 + 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 12, fill: "hsl(222, 47%, 11%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 16%, 93%, 0.5)" }} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      iconType="square"
                      iconSize={10}
                    />
                    {options.map((opt, i) => (
                      <Bar
                        key={opt.id}
                        dataKey={opt.label}
                        stackId="a"
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        radius={
                          i === 0
                            ? [0, 0, 0, 0]
                            : i === options.length - 1
                            ? [0, 4, 4, 0]
                            : [0, 0, 0, 0]
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
