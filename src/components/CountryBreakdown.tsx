import { motion } from "framer-motion";
import type { CountryBreakdown as CB, PollOption } from "@/data/polls";

const barColors = [
  "bg-navy",
  "bg-accent",
  "bg-navy-light",
  "bg-gold-light",
];

export function CountryBreakdown({
  breakdowns,
  options,
}: {
  breakdowns: CB[];
  options: PollOption[];
}) {
  return (
    <div className="mt-4 space-y-4">
      {breakdowns.map((bd, bIdx) => (
        <motion.div
          key={bd.country}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: bIdx * 0.08 }}
          className="rounded-lg bg-secondary/50 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{bd.flag}</span>
            <span className="text-sm font-semibold text-foreground">{bd.country}</span>
          </div>

          <div className="space-y-2">
            {options.map((opt, oIdx) => {
              const pct = bd.results[opt.id] || 0;
              return (
                <div key={opt.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0">
                    {opt.label.length > 20 ? opt.label.slice(0, 20) + "…" : opt.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: bIdx * 0.08 + 0.2 }}
                      className={`h-full rounded-full ${barColors[oIdx % barColors.length]}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums w-8 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
