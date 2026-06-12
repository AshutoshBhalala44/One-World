import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, History, Search, Check, X } from "lucide-react";
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
}

type SortOption = "newest" | "oldest" | "most_voted";
type FilterOption = "all" | "answered" | "unanswered";

export function MyResponses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PastPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchPastPolls();
  }, [user]);

  async function fetchPastPolls() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // 1. Fetch all past polls
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

      // 2. Fetch user's votes for these polls
      const { data: userVotes } = await supabase
        .from("votes")
        .select("poll_id, option_id")
        .eq("user_id", user!.id)
        .in("poll_id", pollIds);

      const voteMap = (userVotes || []).reduce((acc: Record<string, string>, v: any) => {
        acc[v.poll_id] = v.option_id;
        return acc;
      }, {} as Record<string, string>);

      // 3. Fetch all options for these polls
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

      // 4. Fetch vote counts
      const { data: voteCounts } = await supabase.rpc("get_poll_vote_counts");
      const totalsByPoll = (voteCounts || []).reduce(
        (acc: Record<string, number>, row: any) => {
          acc[row.poll_id] = (acc[row.poll_id] || 0) + Number(row.vote_count);
          return acc;
        },
        {} as Record<string, number>
      );

      setPolls(
        pollsData.map((p: any) => ({
          id: p.id,
          poll_id: p.id,
          question: p.question,
          category: p.category,
          active_date: p.active_date,
          option_id: voteMap[p.id] || null,
          options: optionsByPoll[p.id] || [],
          totalVotes: totalsByPoll[p.id] || 0,
        }))
      );
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

  if (polls.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-lg">No previous topics yet. Vote on today's topic!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
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
              ? "No unanswered topics. You've answered them all!"
              : filter === "answered"
              ? "No answered topics yet."
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
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {poll.category}
                </span>
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
              {isAnswered && poll.options && poll.options.length > 0 && (
                <CountryBreakdownChart options={poll.options} />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
