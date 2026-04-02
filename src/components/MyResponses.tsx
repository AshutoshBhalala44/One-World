import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, History } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CountryBreakdownChart } from "./CountryBreakdownChart";

interface VoteWithPoll {
  id: string;
  created_at: string;
  poll_id: string;
  poll: { question: string; category: string; active_date: string };
  option: { label: string };
  pollOptions?: { id: string; label: string }[];
}

export function MyResponses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<VoteWithPoll[]>([]);
  const [loading, setLoading] = useState(true);

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
          poll:polls(question, category, active_date),
          option:poll_options(label)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      const votes = (data as any) || [];

      // Fetch poll options for each unique poll
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

      setResponses(
        votes.map((v: any) => ({
          ...v,
          pollOptions: optionsByPoll[v.poll_id] || [],
        }))
      );
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Sign in to view your previous responses.</p>
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
        <p className="text-lg">No responses yet. Take on today's challenge!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {responses.map((response, i) => (
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
            </span>
          </div>
          <h4 className="font-display text-lg font-bold text-foreground mb-2">
            {response.poll?.question}
          </h4>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/10 text-sm font-medium text-foreground">
            <div className="w-3 h-3 rounded-full bg-navy" />
            {response.option?.label}
          </div>
          {response.pollOptions && response.pollOptions.length > 0 && (
            <CountryBreakdownChart options={response.pollOptions} />
          )}
        </motion.div>
      ))}
    </div>
  );
}
