import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  user_id: string | null;
  message: string;
  category: string;
  created_at: string;
  phone?: string;
}

export function FeedbackAdmin() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFeedback() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((f) => f.user_id).filter(Boolean))) as string[];
      let phoneMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, phone")
          .in("user_id", userIds);
        phoneMap = (profiles || []).reduce((acc: Record<string, string>, p: any) => {
          acc[p.user_id] = p.phone;
          return acc;
        }, {});
      }
      setItems(
        (data || []).map((f: any) => ({ ...f, phone: f.user_id ? phoneMap[f.user_id] : undefined }))
      );
    } catch (err: any) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground">No feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-border bg-card p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-secondary capitalize">{item.category}</span>
              <span>{format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
              {item.phone && <span>· {item.phone}</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
