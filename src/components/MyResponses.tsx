import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, History, Search, Check, X, Globe, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CountryBreakdownChart } from "./CountryBreakdownChart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PastPoll {
  id: string;
  poll_id: string;
  question: string;
  category: string;
  active_date: string;
  option_id: string | null;
  options: { id: string; label: string }[];
  totalVotes: number;
  type: "daily" | "global";
}

type SortOption = "newest" | "oldest" | "most_voted";
type FilterOption = "all" | "answered" | "unanswered";
type TopicType = "daily" | "global";

function getCurrentWeekStart(): string {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const diff = utcDay === 0 ? 6 : utcDay - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().split("T")[0];
}

export function MyResponses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PastPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [topicType, setTopicType] = useState<TopicType>("daily");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchPastPolls();
  }, [user, topicType]);

  async function fetchPastPolls() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const weekStart = getCurrentWeekStart();
      const isDaily = topicType === "daily";

      let mergedPolls: PastPoll[] = [];

      // ── Daily polls ──
      if (isDaily) {
        const { data: allPolls } = await (supabase
          .from("polls")
          .select("id, question, category, active_date")
          .lt("active_date", today) as any)
          .neq("status", "rejected")
          .order("active_date", { ascending: false });

        const pollsData = allPolls || [];
        const pollIds = pollsData.map((p: any) => p.id);

        if (pollIds.length === 0) {
          setPolls([]);
          setLoading(false);
          return;
        }

        const { data: userVotes } = await supabase
          .from("votes")
          .select("poll_id, option_id")
          .eq("user_id", user!.id)
          .in("poll_id", pollIds);

        const voteMap = (userVotes || []).reduce((acc: Record<string, string>, v: any) => {
          acc[v.poll_id] = v.option_id;
          return acc;
        }, {} as Record<string, string>);

        const { data: allOptions } = await supabase
          .from("poll_options")
          .select("id, label, poll_id, sort_order")
          .in("poll_id", pollIds)
          .order("sort_order", { ascending: true });

        const optionsByPoll = (allOptions || []).reduce((acc: any, opt: any) => {
          if (!acc[opt.poll_id]) acc[opt.poll_id] = [];
          acc[opt.poll_id].push({ id: opt.id, label: opt.label });
          return acc;
        }, {} as Record<string, { id: string; label: string }[]>);

        const { data: voteCounts } = await supabase.rpc("get_poll_vote_counts");
        const totalsByPoll = (voteCounts || []).reduce(
          (acc: Record<string, number>, row: any) => {
            acc[row.poll_id] = (acc[row.poll_id] || 0) + Number(row.vote_count);
            return acc;
          },
          {} as Record<string, number>
        );

        mergedPolls = pollsData.map((p: any) => ({
          id: p.id,
          poll_id: p.id,
          question: p.question,
          category: p.category,
          active_date: p.active_date,
          option_id: voteMap[p.id] || null,
          options: optionsByPoll[p.id] || [],
          totalVotes: totalsByPoll[p.id] || 0,
          type: "daily" as const,
        }));
      }

      // ── Global / Weekly polls ──
      if (!isDaily) {
        // Fetch all non-rejected weekly polls whose week has already started
        const { data: allWeekly } = await (supabase
          .from("weekly_polls")
          .select("id, question, category, week_start_date, end_date")
          .lte("week_start_date", today) as any)
          .neq("status", "rejected")
          .order("week_start_date", { ascending: false });

        let weeklyData = (allWeekly || []) as any[];

        // Exclude the currently active weekly poll
        const activeIndex = weeklyData.findIndex((w: any) => {
          if (w.end_date) return w.end_date >= today;
          return w.week_start_date === weekStart;
        });
        if (activeIndex !== -1) {
          weeklyData = weeklyData.filter((_, i) => i !== activeIndex);
        }

        const weeklyIds = weeklyData.map((w: any) => w.id);

        if (weeklyIds.length === 0) {
          setPolls([]);
          setLoading(false);
          return;
        }

        const { data: userWeeklyVotes } = await supabase
          .from("weekly_votes")
          .select("weekly_poll_id, option_id")
          .eq("user_id", user!.id)
          .in("weekly_poll_id", weeklyIds);

        const weeklyVoteMap = (userWeeklyVotes || []).reduce(
          (acc: Record<string, string>, v: any) => {
            acc[v.weekly_poll_id] = v.option_id;
            return acc;
          },
          {} as Record<string, string>
        );

        const { data: weeklyOptions } = await supabase
          .from("weekly_poll_options")
          .select("id, label, weekly_poll_id, sort_order")
          .in("weekly_poll_id", weeklyIds)
          .order("sort_order", { ascending: true });

        const weeklyOptionsByPoll = (weeklyOptions || []).reduce(
          (acc: any, opt: any) => {
            if (!acc[opt.weekly_poll_id]) acc[opt.weekly_poll_id] = [];
            acc[opt.weekly_poll_id].push({ id: opt.id, label: opt.label });
            return acc;
          },
          {} as Record<string, { id: string; label: string }[]>
        );

        const { data: weeklyVoteCounts } = await supabase.rpc("get_weekly_vote_counts");
        const weeklyTotalsByPoll = (weeklyVoteCounts || []).reduce(
          (acc: Record<string, number>, row: any) => {
            acc[row.weekly_poll_id] = (acc[row.weekly_poll_id] || 0) + Number(row.vote_count);
            return acc;
          },
          {} as Record<string, number>
        );

        mergedPolls = weeklyData.map((w: any) => ({
          id: w.id,
          poll_id: w.id,
          question: w.question,
          category: w.category,
          active_date: w.week_start_date,
          option_id: weeklyVoteMap[w.id] || null,
          options: weeklyOptionsByPoll[w.id] || [],
          totalVotes: weeklyTotalsByPoll[w.id] || 0,
          type: "global" as const,
        }));
      }

      setPolls(mergedPolls);
      setBreakdownLoading(true);
      setTimeout(() => setBreakdownLoading(false), 800);
    } catch (err) {
      console.error("Error fetching past polls:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = polls;

    // Apply search filter
    if (q) {
      list = list.filter((r) => {
        const question = r.question?.toLowerCase() || "";
        const category = r.category?.toLowerCase() || "";
        return question.includes(q) || category.includes(q);
      });
    }

    // Apply status filter
    if (filter === "answered") {
      list = list.filter((r) => r.option_id !== null);
    } else if (filter === "unanswered") {
      list = list.filter((r) => r.option_id === null);
    }

    // Apply sort
    const sorted = [...list];
    if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.active_date).getTime() - new Date(a.active_date).getTime()
      );
    } else if (sort === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.active_date).getTime() - new Date(b.active_date).getTime()
      );
    } else if (sort === "most_voted") {
      sorted.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    }
    return sorted;
  }, [polls, search, sort, filter]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Sign in to view your previous topics.</p>
        <button
          onClick={() => navigate("/auth")}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Sign In →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const emptyMessage =
    topicType === "global"
      ? "No previous Global Topics yet."
      : "No previous topics yet. Vote on today's topic!";

  if (polls.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Topic type toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-muted p-1 gap-1">
          <button
            onClick={() => setTopicType("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              topicType === "daily"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Daily
          </button>
          <button
            onClick={() => setTopicType("global")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              topicType === "global"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4" />
            Global
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="most_voted">Most voted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            {filter === "unanswered"
              ? `No unanswered ${topicType} topics. You've answered them all!`
              : filter === "answered"
              ? `No answered ${topicType} topics yet.`
              : "No topics match your search."}
          </p>
        </div>
      ) : (
        filtered.map((poll, i) => {
          const isAnswered = poll.option_id !== null;
          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card shadow-card p-5 border border-border"
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {poll.category}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${
                      poll.type === "global"
                        ? "bg-purple-500/15 text-purple-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {poll.type === "global" ? "Global" : "Daily"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isAnswered ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      Answered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                      <X className="w-3 h-3" />
                      Not Answered
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(poll.active_date).toLocaleDateString()}
                    {sort === "most_voted" && poll.totalVotes !== undefined && (
                      <span className="ml-2">· {poll.totalVotes} votes</span>
                    )}
                  </span>
                </div>
              </div>
              <h4 className="font-display text-lg font-bold text-foreground mb-2">
                {poll.question}
              </h4>
              {poll.options && poll.options.length > 0 && (
                <div className="space-y-2 mt-3">
                  {poll.options.map((opt) => {
                    const isSelected = opt.id === poll.option_id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          isAnswered
                            ? isSelected
                              ? "border-gold bg-gold/10 text-foreground font-medium"
                              : "border-border bg-muted/30 text-muted-foreground"
                            : "border-border bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {isAnswered && isSelected ? (
                          <Check className="w-4 h-4 text-gold shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {poll.options && poll.options.length > 0 && (
                <CountryBreakdownChart
                  options={poll.options}
                  isLoading={false}
                />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
