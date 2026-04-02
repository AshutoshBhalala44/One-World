import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2, Plus, X, Lightbulb, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { categories } from "@/data/polls";

export function SubmitQuestion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20">
        <Lightbulb className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Sign in to submit your own challenge question.</p>
        <button
          onClick={() => navigate("/auth")}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Sign In →
        </button>
      </div>
    );
  }

  function addOption() {
    if (options.length < 4) setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-poll", {
        body: { category },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.question) {
        setQuestion(data.question);
      }
      if (data?.options && Array.isArray(data.options)) {
        setOptions(data.options.slice(0, 4));
      }

      toast.success("AI suggestion generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate suggestion");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    if (options.filter((o) => o.trim()).length < 2) {
      toast.error("Please provide at least 2 answer options");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("question_submissions").insert({
        user_id: user.id,
        question: question.trim(),
        option_1: options[0]?.trim() || "",
        option_2: options[1]?.trim() || "",
        option_3: options[2]?.trim() || null,
        option_4: options[3]?.trim() || null,
        category,
      });

      if (error) throw error;

      toast.success("Question submitted! We'll review it soon.");
      setQuestion("");
      setOptions(["", ""]);
      setCategory("general");
    } catch (err: any) {
      toast.error("Failed to submit question");
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.id !== "all");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="rounded-xl bg-card shadow-card border border-border p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              Suggest a Poll Question
            </h3>
            <p className="text-sm text-muted-foreground">
              Submit your question or let AI generate one for you.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="flex-shrink-0 gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? "Generating…" : "AI Suggest"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((cat) => (
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
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Your Question
            </label>
            <Textarea
              placeholder="e.g., Should the voting age be lowered to 16?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              className="resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Answer Options (2–4)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    maxLength={200}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              )}
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
                Submit Question
                <Send className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
