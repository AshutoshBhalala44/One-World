import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy, Loader2, Users, Lock, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { CountryBreakdownChart } from "./CountryBreakdownChart";

interface WeeklyPollOption {
  id: string;
  label: string;
  sort_order: number;
}

interface WeeklyPoll {
  id: string;
  question: string;
  category: string;
  week_start_date: string;
}

interface VoteCount {
  option_id: string;
  vote_count: number;
}

const optionColors = [
  "from-purple-500/20 to-purple-500/5",
  "from-amber-500/20 to-amber-500/5",
  "from-teal-500/20 to-teal-500/5",
  "from-rose-500/20 to-rose-500/5",
];

const optionAccents = [
  "border-purple-500/40",
  "border-amber-500/40",
  "border-teal-500/40",
  "border-rose-500/40",
];

function getCurrentWeekStart(): string {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const diff = utcDay === 0 ? 6 : utcDay - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().split("T")[0];
}

function getNextMondayMidnight(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatCountdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

interface WeeklyChallengeProps {
  onUnlocked: (unlocked: boolean) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export function WeeklyChallenge({ onUnlocked, scrollRef }: WeeklyChallengeProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<WeeklyPoll | null>(null);
  const [options, setOptions] = useState<WeeklyPollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [noWeeklyPoll, setNoWeeklyPoll] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(getNextMondayMidnight().getTime() - Date.now()));
  const breakdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = getNextMondayMidnight().getTime() - Date.now();
      setCountdown(formatCountdown(ms));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setUserVote(null);
      onUnlocked(false);
    }
    fetchWeeklyPoll();
  }, [user]);

  async function fetchWeeklyPoll() {
    setLoading(true);
    try {
      const weekStart = getCurrentWeekStart();

      const { data: pollData } = await (supabase
        .from("weekly_polls")
        .select("*")
        .eq("week_start_date", weekStart) as any)
        .neq("status", "rejected")
        .maybeSingle();

      if (!pollData) {
        setNoWeeklyPoll(true);
        onUnlocked(true);
        setLoading(false);
        return;
      }

      setPoll(pollData as any);

      const { data: optionsData } = await supabase
        .from("weekly_poll_options")
        .select("*")
        .eq("weekly_poll_id", (pollData as any).id)
        .order("sort_order");

      setOptions((optionsData || []) as any);

      const { data: counts } = await supabase.rpc("get_weekly_vote_counts");
      const filtered = (counts || []).filter((c: any) => c.weekly_poll_id === (pollData as any).id);
      setVoteCounts(filtered as any);

      if (user) {
        const { data: existingVote } = await supabase
          .from("weekly_votes")
          .select("option_id")
          .eq("weekly_poll_id", (pollData as any).id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingVote) {
          setUserVote((existingVote as any).option_id);
          onUnlocked(true);
        } else {
          onUnlocked(false);
        }
      } else {
        onUnlocked(false);
      }
    } catch (err) {
      console.error("Error fetching weekly poll:", err);
      onUnlocked(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeAnswer() {
    if (!user || !poll || !userVote) return;
    setVoting(true);
    try {
      const { error } = await supabase
        .from("weekly_votes")
        .delete()
        .eq("weekly_poll_id", poll.id)
        .eq("user_id", user.id);
      if (error) throw error;

      setUserVote(null);
      onUnlocked(false);

      const { data: counts } = await supabase.rpc("get_weekly_vote_counts");
      const filtered = (counts || []).filter((c: any) => c.weekly_poll_id === poll.id);
      setVoteCounts(filtered as any);

      toast.success("Pick a new answer");
    } catch (err) {
      toast.error("Failed to change answer");
    } finally {
      setVoting(false);
    }
  }

  async function handleVote(optionId: string) {
    if (!user) {
      toast.error("Sign in to answer the weekly challenge", {
        action: { label: "Sign In", onClick: () => navigate("/auth") },
      });
      return;
    }

    if (userVote || !poll) return;

    setVoting(true);
    try {
      const { error } = await supabase.from("weekly_votes").insert({
        weekly_poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });

      if (error) throw error;

      setUserVote(optionId);
      onUnlocked(true);

      const { data: counts } = await supabase.rpc("get_weekly_vote_counts");
      const filtered = (counts || []).filter((c: any) => c.weekly_poll_id === poll.id);
      setVoteCounts(filtered as any);

      toast.success("🎉 Weekly challenge answered! Daily challenges unlocked!");

      // Auto-scroll to country breakdown after a brief delay for render
      setTimeout(() => {
        breakdownRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
    } catch (err: any) {
      if (err.code === "23505") {
        toast.error("You've already answered this week's challenge");
        onUnlocked(true);
      } else {
        toast.error("Failed to submit answer");
      }
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (noWeeklyPoll) return null;

  const totalVotes = voteCounts.reduce((sum, vc) => sum + Number(vc.vote_count), 0);

  function getPercentage(optionId: string) {
    const count = voteCounts.find((vc) => vc.option_id === optionId);
    if (!count || totalVotes === 0) return 0;
    return Math.round((Number(count.vote_count) / totalVotes) * 100);
  }

  const hasVoted = userVote !== null;

  return (
    <motion.div
      ref={scrollRef as any}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden max-w-2xl mx-auto mb-8"
    >
      {/* Header banner */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-display text-lg sm:text-xl font-bold">
              Weekly Challenge
            </h2>
            <p className="text-white/70 text-xs sm:text-sm">
              {hasVoted
                ? "✅ Completed — daily challenges unlocked!"
                : "Answer this to unlock daily challenges"}
            </p>
          </div>
          {!hasVoted && (
            <div className="ml-auto">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
          )}
        </div>

        {/* Countdown timer */}
        <div className="mt-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/60" />
          <span className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wider font-medium">
            Next challenge in
          </span>
          <div className="flex gap-1.5 ml-auto">
            {[
              { val: countdown.days, label: "D" },
              { val: countdown.hours, label: "H" },
              { val: countdown.minutes, label: "M" },
              { val: countdown.seconds, label: "S" },
            ].map(({ val, label }) => (
              <div key={label} className="flex items-center gap-0.5">
                <span className="bg-white/15 backdrop-blur-sm text-white font-mono text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded">
                  {String(val).padStart(2, "0")}
                </span>
                <span className="text-white/50 text-[9px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border border-t-0 border-border rounded-b-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Users className="w-4 h-4" />
          <span>{totalVotes} answers</span>
          <span className="ml-auto text-xs uppercase tracking-wider font-medium">
            {poll?.category}
          </span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-5 leading-snug">
          {poll?.question}
        </h3>

        <div className="space-y-3">
          {options.map((option, i) => {
            const isSelected = userVote === option.id;
            const percentage = getPercentage(option.id);

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || voting}
                className={`relative w-full text-left rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  hasVoted
                    ? `cursor-default ${isSelected ? optionAccents[i % optionAccents.length] : "border-border/50"}`
                    : `cursor-pointer border-border hover:${optionAccents[i % optionAccents.length]} hover:shadow-md active:scale-[0.99]`
                } ${isSelected ? "ring-1 ring-purple-500/30" : ""}`}
              >
                {hasVoted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${optionColors[i % optionColors.length]} rounded-lg`}
                  />
                )}

                <div className="relative flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {!hasVoted && (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400/50 flex-shrink-0" />
                    )}
                    {hasVoted && isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </motion.div>
                    )}
                    {hasVoted && !isSelected && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
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
          })}
        </div>

        {hasVoted && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleChangeAnswer}
              disabled={voting}
              className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
            >
              {voting ? "Updating…" : "Change my answer"}
            </button>
          </div>
        )}

        {hasVoted && (
          <div ref={breakdownRef}>
            <CountryBreakdownChart
              options={options.map((o) => ({ id: o.id, label: o.label }))}
              autoExpand
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Shown when daily challenges are locked */
export function DailyLocked() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 sm:p-12 text-center max-w-2xl mx-auto"
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2">
        Daily Challenge Locked
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        Answer this week's challenge above to unlock today's daily question. It only takes a moment!
      </p>
    </motion.div>
  );
}
