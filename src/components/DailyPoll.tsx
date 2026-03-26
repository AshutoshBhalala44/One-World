import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, Loader2 } from "lucide-react";
import { CountryBreakdownChart } from "./CountryBreakdownChart";
import { toast } from "sonner";

interface PollOption {
  id: string;
  label: string;
  sort_order: number;
}

interface Poll {
  id: string;
  question: string;
  category: string;
  active_date: string;
}

interface VoteCount {
  option_id: string;
  vote_count: number;
}

const optionColors = [
  "bg-navy",
  "bg-accent",
  "bg-navy-light",
  "bg-gold-light",
];

export function DailyPoll() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchTodaysPoll();
  }, [user]);

  async function fetchTodaysPoll() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Try today's poll first, then fall back to the most recent poll
      let { data: pollData } = await (supabase
        .from("polls")
        .select("*")
        .eq("active_date", today) as any)
        .neq("status", "rejected")
        .maybeSingle();

      if (!pollData) {
        const { data: latestPoll } = await (supabase
          .from("polls")
          .select("*")
          .lte("active_date", today) as any)
          .neq("status", "rejected")
          .order("active_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        pollData = latestPoll;
      }

      if (!pollData) {
        setLoading(false);
        return;
      }

      setPoll(pollData);

      const { data: optionsData } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollData.id)
        .order("sort_order");

      setOptions(optionsData || []);

      // Fetch vote counts
      const { data: counts } = await supabase
        .from("poll_vote_counts" as any)
        .select("*")
        .eq("poll_id", pollData.id);

      setVoteCounts((counts as any) || []);

      // Check if user already voted
      if (user) {
        const { data: existingVote } = await supabase
          .from("votes")
          .select("option_id")
          .eq("poll_id", pollData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingVote) {
          setUserVote(existingVote.option_id);
        }
      }
    } catch (err) {
      console.error("Error fetching poll:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(optionId: string) {
    if (!user) {
      toast.error("Sign in to cast your vote", {
        action: { label: "Sign In", onClick: () => navigate("/auth") },
      });
      return;
    }

    if (userVote || !poll) return;

    setVoting(true);
    try {
      const { error } = await supabase.from("votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });

      if (error) throw error;

      setUserVote(optionId);

      // Refresh vote counts
      const { data: counts } = await supabase
        .from("poll_vote_counts" as any)
        .select("*")
        .eq("poll_id", poll.id);

      setVoteCounts((counts as any) || []);
    } catch (err: any) {
      if (err.code === "23505") {
        toast.error("You've already voted on this poll");
      } else {
        toast.error("Failed to cast vote");
      }
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">No poll available today. Check back tomorrow!</p>
      </div>
    );
  }

  const totalVotes = voteCounts.reduce((sum, vc) => sum + Number(vc.vote_count), 0);

  function getPercentage(optionId: string) {
    const count = voteCounts.find((vc) => vc.option_id === optionId);
    if (!count || totalVotes === 0) return 0;
    return Math.round((Number(count.vote_count) / totalVotes) * 100);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card overflow-hidden max-w-2xl mx-auto"
    >
      <div className="p-6 sm:p-8">
        {userVote && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <span className="text-base">✅</span>
            <span>You've already answered today's poll</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Users className="w-4 h-4" />
          <span>{totalVotes} votes</span>
          <span className="ml-auto text-xs uppercase tracking-wider font-medium">
            {poll.category}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold text-foreground mb-6 leading-snug">
          {poll.question}
        </h3>

        <div className="space-y-3">
          {options.map((option, i) => {
            const hasVoted = userVote !== null;
            const isSelected = userVote === option.id;
            const percentage = getPercentage(option.id);

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || voting}
                className={`relative w-full text-left rounded-lg border transition-all duration-200 overflow-hidden ${
                  hasVoted
                    ? "cursor-default border-border"
                    : "cursor-pointer border-border hover:border-navy/40 hover:shadow-sm active:scale-[0.99]"
                } ${isSelected ? "ring-2 ring-navy/30" : ""}`}
              >
                {hasVoted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={`absolute inset-y-0 left-0 ${optionColors[i % optionColors.length]} opacity-15 rounded-lg`}
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
          })}
        </div>

        {userVote && (
          <CountryBreakdownChart
            options={options.map((o) => ({ id: o.id, label: o.label }))}
          />
        )}
      </div>
    </motion.div>
  );
}
