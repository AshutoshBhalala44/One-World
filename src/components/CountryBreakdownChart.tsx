import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  "hsl(222, 60%, 18%)",
  "hsl(40, 95%, 55%)",
  "hsl(222, 40%, 30%)",
  "hsl(42, 100%, 70%)",
];

const ALL_COUNTRIES: { country: string; flag: string }[] = [
  { country: "United States", flag: "🇺🇸" },
  { country: "United Kingdom", flag: "🇬🇧" },
  { country: "India", flag: "🇮🇳" },
  { country: "Germany", flag: "🇩🇪" },
  { country: "Brazil", flag: "🇧🇷" },
  { country: "Japan", flag: "🇯🇵" },
  { country: "Canada", flag: "🇨🇦" },
  { country: "Australia", flag: "🇦🇺" },
  { country: "France", flag: "🇫🇷" },
  { country: "Mexico", flag: "🇲🇽" },
  { country: "South Korea", flag: "🇰🇷" },
  { country: "Italy", flag: "🇮🇹" },
  { country: "Spain", flag: "🇪🇸" },
  { country: "Nigeria", flag: "🇳🇬" },
  { country: "South Africa", flag: "🇿🇦" },
  { country: "Argentina", flag: "🇦🇷" },
  { country: "Indonesia", flag: "🇮🇩" },
  { country: "Turkey", flag: "🇹🇷" },
  { country: "Saudi Arabia", flag: "🇸🇦" },
  { country: "Egypt", flag: "🇪🇬" },
  { country: "Philippines", flag: "🇵🇭" },
  { country: "Thailand", flag: "🇹🇭" },
  { country: "Vietnam", flag: "🇻🇳" },
  { country: "Colombia", flag: "🇨🇴" },
  { country: "Poland", flag: "🇵🇱" },
  { country: "Netherlands", flag: "🇳🇱" },
  { country: "Sweden", flag: "🇸🇪" },
  { country: "Switzerland", flag: "🇨🇭" },
  { country: "Kenya", flag: "🇰🇪" },
  { country: "Pakistan", flag: "🇵🇰" },
];

const DEFAULT_COUNTRIES = ALL_COUNTRIES.slice(0, 6);

function generateCountryData(
  countries: { country: string; flag: string }[],
  options: OptionInfo[]
): CountryData[] {
  const seeds = [0.35, 0.42, 0.28, 0.5, 0.38, 0.45, 0.32, 0.47, 0.3, 0.41];
  return countries.map((bd, cIdx) => {
    const results: Record<string, number> = {};
    let remaining = 100;
    options.forEach((opt, oIdx) => {
      if (oIdx === options.length - 1) {
        results[opt.id] = remaining;
      } else {
        const base = Math.round(100 / options.length);
        const variance = Math.round(
          (seeds[(cIdx + oIdx) % seeds.length] - 0.4) * 30
        );
        const val = Math.max(
          5,
          Math.min(remaining - (options.length - oIdx - 1) * 5, base + variance)
        );
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
          <span className="font-semibold text-foreground tabular-nums">
            {entry.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function CountryBreakdownChart({ options }: { options: OptionInfo[] }) {
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<{
    country: string;
    flag: string;
  } | null>(null);

  const defaultBreakdowns = generateCountryData(DEFAULT_COUNTRIES, options);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) &&
        !DEFAULT_COUNTRIES.some((dc) => dc.country === c.country)
    ).slice(0, 5);
  }, [searchQuery]);

  const selectedBreakdown = useMemo(() => {
    if (!selectedCountry) return null;
    return generateCountryData([selectedCountry], options)[0];
  }, [selectedCountry, options]);

  const chartData = defaultBreakdowns.map((bd) => {
    const row: Record<string, any> = { name: `${bd.flag} ${bd.country}` };
    options.forEach((opt) => {
      row[opt.label] = bd.results[opt.id] || 0;
    });
    return row;
  });

  const selectedChartData = selectedBreakdown
    ? [
        (() => {
          const row: Record<string, any> = {
            name: `${selectedBreakdown.flag} ${selectedBreakdown.country}`,
          };
          options.forEach((opt) => {
            row[opt.label] = selectedBreakdown.results[opt.id] || 0;
          });
          return row;
        })(),
      ]
    : null;

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
              {/* Default chart */}
              <div
                className="w-full"
                style={{ height: defaultBreakdowns.length * 56 + 60 }}
              >
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
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "hsl(220, 16%, 93%, 0.5)" }}
                    />
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

              {/* Search section */}
              <div className="mt-4 border-t border-border/50 pt-3">
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search for a specific country
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedCountry(null);
                        }}
                        placeholder="Type a country name..."
                        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setSelectedCountry(null);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Search results dropdown */}
                    {searchQuery.trim() && !selectedCountry && (
                      <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden">
                        {searchResults.length > 0 ? (
                          searchResults.map((c) => (
                            <button
                              key={c.country}
                              onClick={() => {
                                setSelectedCountry(c);
                                setSearchQuery(c.country);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/60 transition-colors text-left"
                            >
                              <span className="text-base">{c.flag}</span>
                              {c.country}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-xs text-muted-foreground">
                            No countries found
                          </p>
                        )}
                      </div>
                    )}

                    {/* Selected country result */}
                    {selectedCountry && selectedChartData && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-background/60 border border-border/50 p-3"
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Results for {selectedCountry.flag}{" "}
                          {selectedCountry.country}
                        </p>
                        <div className="w-full" style={{ height: 80 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={selectedChartData}
                              layout="vertical"
                              margin={{
                                top: 0,
                                right: 20,
                                left: 10,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                                tick={{
                                  fontSize: 10,
                                  fill: "hsl(220, 10%, 46%)",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{
                                  fontSize: 12,
                                  fill: "hsl(222, 47%, 11%)",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{
                                  fill: "hsl(220, 16%, 93%, 0.5)",
                                }}
                              />
                              {options.map((opt, i) => (
                                <Bar
                                  key={opt.id}
                                  dataKey={opt.label}
                                  stackId="a"
                                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                                  radius={
                                    i === options.length - 1
                                      ? [0, 4, 4, 0]
                                      : [0, 0, 0, 0]
                                  }
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
