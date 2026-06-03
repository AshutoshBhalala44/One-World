import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, History, Search, Check } from "lucide-react";
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

interface VoteWithPoll {
  id: string;
  created_at: string;
  poll_id: string;
  option_id: string;
  poll: { question: string; category: string; active_date: string };
  option: { label: string };
  pollOptions?: { id: string; label: string }[];
  totalVotes?: number;
}

type SortOption = "newest" | "oldest" | "most_voted";

export function MyResponses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<VoteWithPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchResponses();
  }, [user]);

  async function fetchResponses() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("votes")
        .select(`
          id,
          created_at,
          poll_id,
          option_id,
          poll:polls(question, category, active_date),
          option:poll_options(label)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      const votes = (data as any) || [];

      const pollIds = [...new Set(votes.map((v: any) => v.poll_id))];
      const { data: allOptions } = await supabase
        .from("poll_options")
        .select("id, label, poll_id, sort_order")
        .in("poll_id", pollIds as string[])
        .order("sort_order", { ascending: true });

      const optionsByPoll = (allOptions || []).reduce((acc: any, opt: any) => {
        if (!acc[opt.poll_id]) acc[opt.poll_id] = [];
        acc[opt.poll_id].push({ id: opt.id, label: opt.label });
        return acc;
      }, {} as Record<string, { id: string; label: string }[]>);

      // Fetch vote counts to support "most voted" sorting
      const { data: voteCounts } = await supabase.rpc("get_poll_vote_counts");
      const totalsByPoll = (voteCounts || []).reduce(
        (acc: Record<string, number>, row: any) => {
          acc[row.poll_id] = (acc[row.poll_id] || 0) + Number(row.vote_count);
          return acc;
        },
        {} as Record<string, number>
      );

      setResponses(
        votes.map((v: any) => ({
          ...v,
          pollOptions: optionsByPoll[v.poll_id] || [],
          totalVotes: totalsByPoll[v.poll_id] || 0,
        }))
      );
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = responses;
    if (q) {
      list = list.filter((r) => {
        const question = r.poll?.question?.toLowerCase() || "";
        const answer = r.option?.label?.toLowerCase() || "";
        const category = r.poll?.category?.toLowerCase() || "";
        return (
          question.includes(q) || answer.includes(q) || category.includes(q)
        );
      });
    }
    const sorted = [...list];
    if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "most_voted") {
      sorted.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    }
    return sorted;
  }, [responses, search, sort]);

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

  if (responses.length === 0) {
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
            placeholder="Search questions or answers..."
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <p>No topics match your search.</p>
        </div>
      ) : (
        filtered.map((response, i) => (
          <motion.div
            key={response.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card shadow-card p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {response.poll?.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(response.created_at).toLocaleDateString()}
                {sort === "most_voted" && response.totalVotes !== undefined && (
                  <span className="ml-2">· {response.totalVotes} votes</span>
                )}
              </span>
            </div>
            <h4 className="font-display text-lg font-bold text-foreground mb-2">
              {response.poll?.question}
            </h4>
            {response.pollOptions && response.pollOptions.length > 0 && (
              <div className="space-y-2 mt-3">
                {response.pollOptions.map((opt) => {
                  const isSelected = opt.id === response.option_id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        isSelected
                          ? "border-gold bg-gold/10 text-foreground font-medium"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {isSelected ? (
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
            {response.pollOptions && response.pollOptions.length > 0 && (
              <CountryBreakdownChart options={response.pollOptions} />
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}
