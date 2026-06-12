import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "general", label: "💬 General" },
  { id: "bug", label: "🐛 Bug" },
  { id: "feature", label: "✨ Feature Idea" },
  { id: "other", label: "❓ Other" },
];

export function FeedbackForm() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please enter your feedback");
      return;
    }
    if (trimmed.length > 2000) {
      toast.error("Feedback must be 2000 characters or less");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        message: trimmed,
        category,
      });
      if (error) throw error;
      toast.success("Thanks! Your feedback has been sent.");
      setMessage("");
      setCategory("general");
    } catch (err: any) {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="rounded-xl bg-card shadow-card border border-border p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              Send Feedback
            </h3>
            <p className="text-sm text-muted-foreground">
              Tell us what's working, what's broken, or what you'd love to see.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === cat.id
                      ? "bg-navy text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-message" className="text-sm font-medium text-foreground mb-1.5 block">
              Your Feedback
            </label>
            <Textarea
              id="feedback-message"
              placeholder="Share your thoughts…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {message.length}/2000
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send Feedback
                <Send className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
