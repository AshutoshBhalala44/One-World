import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Poll } from "@/data/polls";
import { CountryBreakdown } from "./CountryBreakdown";
import { ChevronDown, ChevronUp, TrendingUp, Users } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const optionColors = [
  "bg-navy",
  "bg-accent",
  "bg-navy-light",
  "bg-gold-light",
];

const optionTextColors = [
  "text-primary-foreground",
  "text-accent-foreground",
  "text-primary-foreground",
  "text-accent-foreground",
];

export function PollCard({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [showCountries, setShowCountries] = useState(false);

  const totalVotes = voted
    ? poll.totalVotes + 1
    : poll.totalVotes;

  const getPercentage = (option: typeof poll.options[0]) => {
    const votes = voted === option.id ? option.votes + 1 : option.votes;
    const total = voted ? poll.totalVotes + 1 : poll.totalVotes;
    return Math.round((votes / total) * 100);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{formatNumber(totalVotes)} votes</span>
            {poll.trending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {poll.category}
          </span>
        </div>

        {/* Question */}
        <h3 className="font-display text-xl font-bold text-foreground mb-6 leading-snug">
          {poll.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {poll.options.map((option, i) => (
            <VoteOption
              key={option.id}
              option={option}
              index={i}
              voted={voted}
              percentage={getPercentage(option)}
              onVote={() => setVoted(option.id)}
            />
          ))}
        </div>

        {/* Country Breakdown Toggle */}
        {voted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5"
          >
            <button
              onClick={() => setShowCountries(!showCountries)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-lg hover:bg-secondary/50"
            >
              🌍 View by Country
              {showCountries ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showCountries && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <CountryBreakdown
                    breakdowns={poll.countryBreakdowns}
                    options={poll.options}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function VoteOption({
  option,
  index,
  voted,
  percentage,
  onVote,
}: {
  option: { id: string; label: string; votes: number };
  index: number;
  voted: string | null;
  percentage: number;
  onVote: () => void;
}) {
  const isSelected = voted === option.id;
  const hasVoted = voted !== null;

  return (
    <button
      onClick={() => !hasVoted && onVote()}
      disabled={hasVoted}
      className={`relative w-full text-left rounded-lg border transition-all duration-200 overflow-hidden ${
        hasVoted
          ? "cursor-default border-border"
          : "cursor-pointer border-border hover:border-navy/40 hover:shadow-sm active:scale-[0.99]"
      } ${isSelected ? "ring-2 ring-navy/30" : ""}`}
    >
      {/* Fill bar */}
      {hasVoted && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className={`absolute inset-y-0 left-0 ${optionColors[index % optionColors.length]} opacity-15 rounded-lg`}
        />
      )}

      <div className="relative flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          {!hasVoted && (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
          )}
          {hasVoted && isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 rounded-full bg-navy flex-shrink-0 flex items-center justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            </motion.div>
          )}
          {hasVoted && !isSelected && (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
          )}
          <span className={`text-sm font-medium ${hasVoted && isSelected ? "text-foreground" : "text-foreground/80"}`}>
            {option.label}
          </span>
        </div>

        {hasVoted && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-sm font-bold tabular-nums ${
              isSelected ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {percentage}%
          </motion.span>
        )}
      </div>
    </button>
  );
}
