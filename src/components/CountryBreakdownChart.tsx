import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFlipFace } from "./FlipCard";

import { ChevronDown, ChevronUp, Search, X, Globe } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

export interface CountryData {
  country: string;
  flag: string;
  code: string;
  results: Record<string, number>;
}

interface OptionInfo {
  id: string;
  label: string;
}

const CHART_COLORS = [
  "hsl(255, 92%, 76%)",   // soft violet
  "hsl(40, 95%, 55%)",    // gold/amber
  "hsl(172, 42%, 52%)",   // muted teal
  "hsl(340, 75%, 60%)",   // rose/pink
];

const ALL_COUNTRIES: { country: string; flag: string; code: string }[] = [
  { country: "United States", flag: "🇺🇸", code: "USA" },
  { country: "United Kingdom", flag: "🇬🇧", code: "GBR" },
  { country: "India", flag: "🇮🇳", code: "IND" },
  { country: "Germany", flag: "🇩🇪", code: "GER" },
  { country: "Brazil", flag: "🇧🇷", code: "BRA" },
  { country: "Japan", flag: "🇯🇵", code: "JPN" },
  { country: "Canada", flag: "🇨🇦", code: "CAN" },
  { country: "Australia", flag: "🇦🇺", code: "AUS" },
  { country: "France", flag: "🇫🇷", code: "FRA" },
  { country: "Mexico", flag: "🇲🇽", code: "MEX" },
  { country: "South Korea", flag: "🇰🇷", code: "KOR" },
  { country: "Italy", flag: "🇮🇹", code: "ITA" },
  { country: "Spain", flag: "🇪🇸", code: "ESP" },
  { country: "Nigeria", flag: "🇳🇬", code: "NGR" },
  { country: "South Africa", flag: "🇿🇦", code: "RSA" },
  { country: "Argentina", flag: "🇦🇷", code: "ARG" },
  { country: "Indonesia", flag: "🇮🇩", code: "INA" },
  { country: "Turkey", flag: "🇹🇷", code: "TUR" },
  { country: "Saudi Arabia", flag: "🇸🇦", code: "KSA" },
  { country: "Egypt", flag: "🇪🇬", code: "EGY" },
  { country: "Philippines", flag: "🇵🇭", code: "PHI" },
  { country: "Thailand", flag: "🇹🇭", code: "THA" },
  { country: "Vietnam", flag: "🇻🇳", code: "VIE" },
  { country: "Colombia", flag: "🇨🇴", code: "COL" },
  { country: "Poland", flag: "🇵🇱", code: "POL" },
  { country: "Netherlands", flag: "🇳🇱", code: "NED" },
  { country: "Sweden", flag: "🇸🇪", code: "SWE" },
  { country: "Switzerland", flag: "🇨🇭", code: "SUI" },
  { country: "Kenya", flag: "🇰🇪", code: "KEN" },
  { country: "Pakistan", flag: "🇵🇰", code: "PAK" },
];

const DEFAULT_COUNTRIES = ALL_COUNTRIES.slice(0, 6);
const MAX_DEFAULT_COUNTRIES = 4;

function totalVotes(results: Record<string, number>): number {
  let sum = 0;
  for (const v of Object.values(results)) sum += v || 0;
  return sum;
}

export function pickTopCountries(
  breakdowns: CountryData[],
  max: number = MAX_DEFAULT_COUNTRIES
): CountryData[] {
  const usa = breakdowns.find((b) => b.code === "USA");
  const rest = breakdowns
    .filter((b) => b.code !== "USA")
    .sort((a, b) => totalVotes(b.results) - totalVotes(a.results))
    .slice(0, usa ? max - 1 : max);
  return usa ? [usa, ...rest] : rest;
}

function generateCountryData(
  countries: { country: string; flag: string; code: string }[],
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

// Use semantic tokens so axis/cursor stay WCAG AA in both light and dark
// themes. muted-foreground is tuned to clear 4.5:1 against card/secondary
// backgrounds in every scheme; hardcoded greys previously failed in light mode.
const AXIS_TEXT_COLOR = "hsl(var(--muted-foreground))";
const CURSOR_COLOR = "hsl(var(--foreground) / 0.08)";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName ?? label;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs break-words w-[min(240px,calc(100vw-2rem))]">
      <p className="font-semibold text-foreground mb-1.5 leading-tight">{fullName}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground truncate flex-1 min-w-0">{entry.name}</span>
            <span className="font-semibold text-foreground tabular-nums flex-shrink-0">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SkeletonBarRow = memo(function SkeletonBarRow({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Skeleton shimmer className="w-6 h-4 rounded-sm shrink-0" />
      <Skeleton shimmer className={`${isMobile ? "w-8" : "w-12"} h-4 rounded-sm shrink-0`} />
      <div className="flex-1 flex gap-0.5 h-4 ml-2">
        <Skeleton shimmer className="h-full rounded-l-sm w-[35%]" />
        <Skeleton shimmer className="h-full w-[25%]" />
        <Skeleton shimmer className="h-full w-[25%]" />
        <Skeleton shimmer className="h-full rounded-r-sm w-[15%]" />
      </div>
    </div>
  );
});

const SKELETON_ROWS = [0, 1, 2, 3];

const ChartSkeleton = memo(function ChartSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 pb-2 border-b border-border/30 mb-2">
        <Skeleton shimmer className="w-8 h-3 rounded-sm" />
        <Skeleton shimmer className="w-8 h-3 rounded-sm ml-auto" />
        <Skeleton shimmer className="w-8 h-3 rounded-sm" />
        <Skeleton shimmer className="w-8 h-3 rounded-sm" />
        <Skeleton shimmer className="w-8 h-3 rounded-sm" />
      </div>
      {SKELETON_ROWS.map((i) => (
        <SkeletonBarRow key={i} isMobile={isMobile} />
      ))}
      <div className="flex flex-col gap-2 mt-4 w-full items-center sm:items-stretch">
        {SKELETON_ROWS.map((i) => (
          <div key={i} className="flex items-start gap-2.5 w-full justify-center sm:justify-start">
            <Skeleton shimmer className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-sm" />
            <Skeleton shimmer className="w-48 h-4 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Globe className="w-10 h-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground max-w-[240px]">{message}</p>
    </div>
  );
});


export function CountryBreakdownChart({
  options,
  autoExpand = false,
  isLoading = false,
  breakdowns,
  emptyMessage = "Country breakdown data is not available for this topic.",
  expanded: controlledExpanded,
  onExpandedChange,
}: {
  options: OptionInfo[];
  autoExpand?: boolean;
  isLoading?: boolean;
  breakdowns?: CountryData[];
  emptyMessage?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const yAxisWidth = isMobile ? 64 : 120;
  const yAxisFontSize = isMobile ? 12 : 15;
  const xAxisFontSize = isMobile ? 11 : 10;
  const xAxisTicks = isMobile ? [0, 50, 100] : [0, 25, 50, 75, 100];
  const rowHeight = isMobile ? 44 : 56;
  const chartRightMargin = isMobile ? 16 : 15;
  const [internalExpanded, setInternalExpanded] = useState(autoExpand);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setExpanded = (value: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(value);
    }
    onExpandedChange?.(value);
  };

  // If we're inside a FlipCard face, collapse the breakdown whenever this
  // face flips out of view. Otherwise its content can bleed through and be
  // read backwards from the opposite side on mobile.
  const { isActive: faceIsActive } = useFlipFace();
  useEffect(() => {
    if (!faceIsActive && expanded) {
      setExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceIsActive]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<{
    country: string;
    flag: string;
    code: string;
  } | null>(null);

  const resolvedBreakdowns = useMemo(() => {
    if (isLoading) return [] as CountryData[];
    if (breakdowns !== undefined) return breakdowns;
    return generateCountryData(DEFAULT_COUNTRIES, options);
  }, [isLoading, breakdowns, options]);

  const defaultBreakdowns = useMemo(
    () => (isLoading ? [] : pickTopCountries(resolvedBreakdowns)),
    [isLoading, resolvedBreakdowns]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) &&
        !defaultBreakdowns.some((dc) => dc.country === c.country)
    ).slice(0, 5);
  }, [searchQuery, defaultBreakdowns]);

  const selectedBreakdown = useMemo(() => {
    if (!selectedCountry) return null;
    return generateCountryData([selectedCountry], options)[0];
  }, [selectedCountry, options]);

  const chartData = useMemo(
    () =>
      defaultBreakdowns.map((bd) => {
        const row: Record<string, any> = {
          name: `${bd.flag} ${bd.code}`,
          fullName: `${bd.flag} ${bd.country}`,
        };
        options.forEach((opt) => {
          row[opt.label] = bd.results[opt.id] || 0;
        });
        return row;
      }),
    [defaultBreakdowns, options]
  );

  const selectedChartData = useMemo(() => {
    if (!selectedBreakdown) return null;
    const row: Record<string, any> = {
      name: `${selectedBreakdown.flag} ${selectedBreakdown.code}`,
      fullName: `${selectedBreakdown.flag} ${selectedBreakdown.country}`,
    };
    options.forEach((opt) => {
      row[opt.label] = selectedBreakdown.results[opt.id] || 0;
    });
    return [row];
  }, [selectedBreakdown, options]);

  const chartKey = useMemo(
    () =>
      `chart:${options.map((o) => o.id).join("|")}:${defaultBreakdowns
        .map((b) => b.code)
        .join("|")}`,
    [options, defaultBreakdowns]
  );


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
            <div className="mt-4 rounded-lg bg-secondary/30 p-2 sm:p-4">
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChartSkeleton isMobile={isMobile} />
                  </motion.div>
                ) : breakdowns !== undefined && breakdowns.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <EmptyState message={emptyMessage} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={chartKey}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {/* Default chart */}
                    <div
                      className="w-full"
                      style={{ height: defaultBreakdowns.length * rowHeight + 60 }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 5, right: chartRightMargin, left: 0, bottom: 5 }}
                          barCategoryGap={isMobile ? "28%" : "20%"}
                        >
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            ticks={xAxisTicks}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: xAxisFontSize, fill: AXIS_TEXT_COLOR }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={yAxisWidth}
                            tick={{ fontSize: yAxisFontSize, fill: AXIS_TEXT_COLOR }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: CURSOR_COLOR }}
                            wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                            allowEscapeViewBox={{ x: true, y: true }}
                            offset={isMobile ? 16 : 12}
                          />
                          {options.map((opt, i) => (
                            <Bar
                              key={opt.id}
                              dataKey={opt.label}
                              stackId="a"
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              isAnimationActive
                              animationDuration={600}
                              animationEasing="ease-out"
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

                    {/* Legend */}
                    <div className="flex flex-col gap-2 mt-4 mb-1 w-full items-center sm:items-stretch">
                      {options.map((opt, i) => (
                        <motion.div
                          key={opt.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                          className="flex items-start gap-2.5 w-full justify-center sm:justify-start text-center sm:text-left"
                        >
                          <div
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-sm text-muted-foreground leading-snug break-words min-w-0 sm:flex-1">
                            {opt.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Search section - hide when loading or empty */}
              {!isLoading && !(breakdowns !== undefined && breakdowns.length === 0) && (
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
                                  right: chartRightMargin,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <XAxis
                                  type="number"
                                  domain={[0, 100]}
                                  ticks={xAxisTicks}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{
                                    fontSize: xAxisFontSize,
                                    fill: AXIS_TEXT_COLOR,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  width={yAxisWidth}
                                  tick={{
                                    fontSize: yAxisFontSize,
                                    fill: AXIS_TEXT_COLOR,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                  content={<CustomTooltip />}
                                  cursor={{
                                    fill: CURSOR_COLOR,
                                  }}
                                  wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                                  allowEscapeViewBox={{ x: true, y: true }}
                                  offset={isMobile ? 16 : 12}
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
