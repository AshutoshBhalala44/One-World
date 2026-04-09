import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  ShieldAlert,
  Check,
  X,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  RefreshCw,
  Plus,
  CalendarIcon,
  Trophy,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, addWeeks } from "date-fns";

function getCurrentAdminWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split("T")[0];
}
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PollWithOptions {
  id: string;
  question: string;
  category: string;
  active_date: string;
  status: string;
  needs_review: boolean;
  created_at: string;
  options: { id: string; label: string; sort_order: number }[];
}

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  phone?: string;
}

interface WeeklyPollWithOptions {
  id: string;
  question: string;
  category: string;
  week_start_date: string;
  status: string;
  needs_review: boolean;
  created_at: string;
  options: { id: string; label: string; sort_order: number }[];
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const navigate = useNavigate();

  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [editingPoll, setEditingPoll] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [creating, setCreating] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());

  // Weekly polls state
  const [weeklyPolls, setWeeklyPolls] = useState<WeeklyPollWithOptions[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [weeklyQuestion, setWeeklyQuestion] = useState("");
  const [weeklyCategory, setWeeklyCategory] = useState("general");
  const [weeklyOptions, setWeeklyOptions] = useState(["", "", "", ""]);
  const [weeklyDate, setWeeklyDate] = useState(() => {
    const next = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    return format(next, "yyyy-MM-dd");
  });
  const [creatingWeekly, setCreatingWeekly] = false);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  useEffect(() => {
    if (!roleLoading && !isAdmin) return;
    if (isAdmin) {
      fetchPolls();
      fetchAdmins();
      fetchWeeklyPolls();
    }
  }, [isAdmin, roleLoading]);

  async function fetchPolls() {
    setLoadingPolls(true);
    try {
      const { data: pollsData } = await supabase
        .from("polls")
        .select("*")
        .order("active_date", { ascending: false })
        .limit(30);

      if (!pollsData) {
        setPolls([]);
        return;
      }

      const pollIds = pollsData.map((p: any) => p.id);
      const { data: optionsData } = await supabase
        .from("poll_options")
        .select("*")
        .in("poll_id", pollIds)
        .order("sort_order");

      const optionsByPoll = (optionsData || []).reduce((acc: any, opt: any) => {
        if (!acc[opt.poll_id]) acc[opt.poll_id] = [];
        acc[opt.poll_id].push(opt);
        return acc;
      }, {} as Record<string, any[]>);

      setPolls(
        pollsData.map((p: any) => ({
          ...p,
          options: optionsByPoll[p.id] || [],
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load polls");
    } finally {
      setLoadingPolls(false);
    }
  }

  async function fetchAdmins() {
    setLoadingAdmins(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (data) {
        // Get phone numbers from profiles
        const userIds = data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, phone")
          .in("user_id", userIds);

        const phoneMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p.phone;
          return acc;
        }, {} as Record<string, string>);

        setAdmins(
          data.map((r: any) => ({
            ...r,
            phone: phoneMap[r.user_id] || "Unknown",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function fetchWeeklyPolls() {
    setLoadingWeekly(true);
    try {
      const { data: pollsData } = await supabase
        .from("weekly_polls")
        .select("*")
        .order("week_start_date", { ascending: false })
        .limit(20);
      if (!pollsData) { setWeeklyPolls([]); return; }
      const pollIds = pollsData.map((p: any) => p.id);
      const { data: optionsData } = await supabase
        .from("weekly_poll_options")
        .select("*")
        .in("weekly_poll_id", pollIds)
        .order("sort_order");
      const optionsByPoll = (optionsData || []).reduce((acc: any, opt: any) => {
        if (!acc[opt.weekly_poll_id]) acc[opt.weekly_poll_id] = [];
        acc[opt.weekly_poll_id].push(opt);
        return acc;
      }, {} as Record<string, any[]>);
      setWeeklyPolls(pollsData.map((p: any) => ({ ...p, options: optionsByPoll[p.id] || [] })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load weekly polls");
    } finally { setLoadingWeekly(false); }
  }

  async function handleCreateWeeklyPoll() {
    if (!weeklyQuestion.trim()) { toast.error("Please enter a question"); return; }
    const validOpts = weeklyOptions.filter((o) => o.trim());
    if (validOpts.length < 2) { toast.error("At least 2 options required"); return; }
    setCreatingWeekly(true);
    try {
      const { data: newPoll, error: pollErr } = await supabase
        .from("weekly_polls")
        .insert({ question: weeklyQuestion.trim(), category: weeklyCategory, week_start_date: weeklyDate, status: "approved", needs_review: false } as any)
        .select("id").single();
      if (pollErr) throw pollErr;
      const optionRows = validOpts.map((label, idx) => ({ weekly_poll_id: (newPoll as any).id, label: label.trim(), sort_order: idx }));
      const { error: optErr } = await supabase.from("weekly_poll_options").insert(optionRows);
      if (optErr) throw optErr;
      toast.success("Weekly poll created!");
      setShowWeeklyForm(false);
      setWeeklyQuestion(""); setWeeklyCategory("general"); setWeeklyOptions(["", "", "", ""]);
      setWeeklyDate(format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd"));
      fetchWeeklyPolls();
    } catch (err: any) { toast.error("Failed: " + (err.message || "Unknown error")); }
    finally { setCreatingWeekly(false); }
  }

  async function handleDeleteWeeklyPoll(pollId: string) {
    if (!confirm("Delete this weekly poll permanently?")) return;
    await supabase.from("weekly_poll_options").delete().eq("weekly_poll_id", pollId);
    const { error } = await supabase.from("weekly_polls").delete().eq("id", pollId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Weekly poll deleted");
    fetchWeeklyPolls();
  }

  async function handleApprove(pollId: string) {
    const { error } = await supabase
      .from("polls")
      .update({ status: "approved", needs_review: false } as any)
      .eq("id", pollId);

    if (error) {
      toast.error("Failed to approve poll");
      return;
    }
    toast.success("Poll approved");
    fetchPolls();
  }

  async function handleReject(pollId: string) {
    const { error } = await supabase
      .from("polls")
      .update({ status: "rejected", needs_review: false } as any)
      .eq("id", pollId);

    if (error) {
      toast.error("Failed to reject poll");
      return;
    }
    toast.success("Poll rejected — it won't appear to users");
    fetchPolls();
  }

  async function handleDelete(pollId: string) {
    if (!confirm("Delete this poll permanently?")) return;

    // Delete options first, then poll
    await supabase.from("poll_options").delete().eq("poll_id", pollId);
    const { error } = await supabase.from("polls").delete().eq("id", pollId);

    if (error) {
      toast.error("Failed to delete poll");
      return;
    }
    toast.success("Poll deleted");
    fetchPolls();
  }

  function startEdit(poll: PollWithOptions) {
    setEditingPoll(poll.id);
    setEditQuestion(poll.question);
    setEditOptions(poll.options.map((o) => o.label));
  }

  async function saveEdit(poll: PollWithOptions) {
    const { error: pollErr } = await supabase
      .from("polls")
      .update({ question: editQuestion } as any)
      .eq("id", poll.id);

    if (pollErr) {
      toast.error("Failed to update question");
      return;
    }

    // Update options
    for (let i = 0; i < poll.options.length; i++) {
      if (editOptions[i] !== poll.options[i].label) {
        await supabase
          .from("poll_options")
          .update({ label: editOptions[i] } as any)
          .eq("id", poll.options[i].id);
      }
    }

    toast.success("Poll updated");
    setEditingPoll(null);
    fetchPolls();
  }

  async function handleAddAdmin() {
    if (!newAdminPhone.trim()) return;
    setAddingAdmin(true);

    try {
      // Find user by phone in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", newAdminPhone.trim())
        .maybeSingle();

      if (!profile) {
        toast.error("No user found with that phone number");
        setAddingAdmin(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.user_id,
        role: "admin",
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast.error("User is already an admin");
        } else {
          toast.error("Failed to add admin: " + error.message);
        }
        setAddingAdmin(false);
        return;
      }

      toast.success("Admin added");
      setNewAdminPhone("");
      fetchAdmins();
    } catch (err) {
      toast.error("Error adding admin");
    } finally {
      setAddingAdmin(false);
    }
  }

  async function handleRemoveAdmin(roleId: string, userId: string) {
    if (userId === user?.id) {
      toast.error("You can't remove yourself as admin");
      return;
    }
    if (!confirm("Remove this admin?")) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      toast.error("Failed to remove admin");
      return;
    }
    toast.success("Admin removed");
    fetchAdmins();
  }

  async function handleCreatePoll() {
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }
    const validOptions = newOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }
    if (!newDate) {
      toast.error("Please select a date");
      return;
    }

    setCreating(true);
    try {
      const { data: newPoll, error: pollErr } = await supabase
        .from("polls")
        .insert({
          question: newQuestion.trim(),
          category: newCategory,
          active_date: newDate,
          status: "approved",
          needs_review: false,
        } as any)
        .select("id")
        .single();

      if (pollErr) throw pollErr;

      const optionRows = validOptions.map((label, idx) => ({
        poll_id: (newPoll as any).id,
        label: label.trim(),
        sort_order: idx,
      }));

      const { error: optErr } = await supabase
        .from("poll_options")
        .insert(optionRows);

      if (optErr) throw optErr;

      toast.success("Poll created successfully");
      setShowCreateForm(false);
      setNewQuestion("");
      setNewCategory("general");
      setNewOptions(["", "", "", ""]);
      setNewDate(new Date().toISOString().split("T")[0]);
      fetchPolls();
    } catch (err: any) {
      toast.error("Failed to create poll: " + (err.message || "Unknown error"));
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateNow() {
    setGenerating(true);
    try {
      const resp = await supabase.functions.invoke("generate-daily-poll", {
        body: {},
      });

      if (resp.error) throw resp.error;

      const data = resp.data;
      if (data?.success) {
        toast.success(`Generated ${data.date}: "${data.question}"`);
        fetchPolls();
      } else {
        toast.info(data?.message || "No open poll date was available");
      }
    } catch (err) {
      toast.error("Failed to generate poll");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="w-16 h-16 text-destructive/40 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-6">
            You need admin privileges to access this page.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const reviewPolls = polls.filter((p) => p.needs_review);
  const allPolls = polls;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage polls, review AI-generated content, and administer users.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
              variant={showCreateForm ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showCreateForm ? "Cancel" : "Create Poll"}
            </Button>
            <Button
              onClick={handleGenerateNow}
              disabled={generating}
              variant="outline"
              size="sm"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              AI Generate
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-5"
          >
            <h3 className="font-semibold text-foreground mb-4">Create New Poll</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Question
                </label>
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What do you think about...?"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground"
                  >
                    {["general", "technology", "politics", "environment", "society", "economy", "health", "culture", "science", "education"].map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Active Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Options (2–4)
                </label>
                <div className="space-y-2">
                  {newOptions.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = e.target.value;
                        setNewOptions(updated);
                      }}
                      placeholder={`Option ${i + 1}${i >= 2 ? " (optional)" : ""}`}
                      className="w-full px-3 py-1.5 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground"
                      maxLength={100}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreatePoll}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create Poll
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {reviewPolls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border-2 border-accent/50 bg-accent/5 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">
                {reviewPolls.length} poll{reviewPolls.length > 1 ? "s" : ""}{" "}
                pending review
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              These AI-generated polls went live automatically but haven't been
              reviewed yet.
            </p>
          </motion.div>
        )}

        <Tabs defaultValue="polls" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="polls">📊 Polls</TabsTrigger>
            <TabsTrigger value="weekly">🏆 Weekly</TabsTrigger>
            <TabsTrigger value="schedule">📅 Schedule</TabsTrigger>
            <TabsTrigger value="admins">👤 Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="polls">
            {loadingPolls ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {allPolls.map((poll, i) => {
                  const isEditing = editingPoll === poll.id;

                  return (
                    <motion.div
                      key={poll.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl border p-4 ${
                        poll.needs_review
                          ? "border-accent/40 bg-accent/5"
                          : poll.status === "rejected"
                          ? "border-destructive/30 bg-destructive/5 opacity-60"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {poll.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {poll.active_date}
                            </span>
                            {poll.needs_review && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold uppercase tracking-wider">
                                Needs Review
                              </span>
                            )}
                            {poll.status === "rejected" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold uppercase tracking-wider">
                                Rejected
                              </span>
                            )}
                            {poll.status === "approved" && !poll.needs_review && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-semibold uppercase tracking-wider">
                                Approved
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground"
                              />
                              {editOptions.map((opt, j) => (
                                <input
                                  key={j}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...editOptions];
                                    newOpts[j] = e.target.value;
                                    setEditOptions(newOpts);
                                  }}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-background border border-border text-foreground"
                                  placeholder={`Option ${j + 1}`}
                                />
                              ))}
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(poll)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingPoll(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-foreground text-sm leading-snug">
                                {poll.question}
                              </h4>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {poll.options.map((opt) => (
                                  <span
                                    key={opt.id}
                                    className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground"
                                  >
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {poll.needs_review && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10"
                                  title="Approve"
                                  onClick={() => handleApprove(poll.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  title="Reject"
                                  onClick={() => handleReject(poll.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => startEdit(poll)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Delete"
                              onClick={() => handleDelete(poll.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>


          <TabsContent value="weekly">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Weekly Challenges
                </h3>
                <Button size="sm" onClick={() => setShowWeeklyForm(!showWeeklyForm)} variant={showWeeklyForm ? "secondary" : "default"}>
                  <Plus className="w-4 h-4 mr-2" />
                  {showWeeklyForm ? "Cancel" : "Create Weekly"}
                </Button>
              </div>

              {showWeeklyForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
                  <h4 className="font-semibold text-foreground mb-3">New Weekly Challenge</h4>
                  <p className="text-xs text-muted-foreground mb-4">Weekly challenges start on Mondays. Users must answer before accessing daily questions.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Question</label>
                      <input value={weeklyQuestion} onChange={(e) => setWeeklyQuestion(e.target.value)} placeholder="This week's big question..." className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" maxLength={200} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                        <select value={weeklyCategory} onChange={(e) => setWeeklyCategory(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground">
                          {["general", "technology", "politics", "environment", "society", "economy", "health", "culture", "science", "education"].map((c) => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Week Start (Monday)</label>
                        <input type="date" value={weeklyDate} onChange={(e) => setWeeklyDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Options (2–4)</label>
                      <div className="space-y-2">
                        {weeklyOptions.map((opt, i) => (
                          <input key={i} value={opt} onChange={(e) => { const u = [...weeklyOptions]; u[i] = e.target.value; setWeeklyOptions(u); }} placeholder={`Option ${i + 1}${i >= 2 ? " (optional)" : ""}`} className="w-full px-3 py-1.5 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground" maxLength={100} />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowWeeklyForm(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleCreateWeeklyPoll} disabled={creatingWeekly}>
                        {creatingWeekly ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Weekly Challenge
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {loadingWeekly ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : weeklyPolls.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No weekly challenges yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weeklyPolls.map((wp, i) => (
                    <motion.div key={wp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{wp.category}</span>
                            <span className="text-xs text-muted-foreground">Week of {wp.week_start_date}</span>
                          </div>
                          <h4 className="font-semibold text-foreground text-sm leading-snug">{wp.question}</h4>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {wp.options.map((opt) => (
                              <span key={opt.id} className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">{opt.label}</span>
                            ))}
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => handleDeleteWeeklyPoll(wp.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            {(() => {
              const pollDates = polls.reduce((acc, p) => {
                acc[p.active_date] = (acc[p.active_date] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const weeklyDates = weeklyPolls.reduce((acc, wp) => {
                acc[wp.week_start_date] = wp;
                return acc;
              }, {} as Record<string, WeeklyPollWithOptions>);

              const selectedDateStr = selectedCalendarDate
                ? format(selectedCalendarDate, "yyyy-MM-dd")
                : null;

              const pollsForDate = selectedDateStr
                ? polls.filter((p) => p.active_date === selectedDateStr)
                : [];

              // Check if selected date falls within a weekly poll week
              const selectedWeekStart = selectedCalendarDate
                ? format(startOfWeek(selectedCalendarDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
                : null;
              const weeklyForDate = selectedWeekStart ? weeklyDates[selectedWeekStart] : undefined;

              const scheduledDates = Object.keys(pollDates).map(
                (d) => new Date(d + "T00:00:00")
              );

              const weeklyStartDates = Object.keys(weeklyDates).map(
                (d) => new Date(d + "T00:00:00")
              );

              return (
                <div className="space-y-6">
                  {/* Upcoming weekly schedule overview */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Weekly Challenge Schedule
                    </h3>
                    {weeklyPolls.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No weekly challenges scheduled yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {weeklyPolls.slice(0, 6).map((wp) => {
                          const weekEnd = new Date(wp.week_start_date + "T00:00:00");
                          weekEnd.setDate(weekEnd.getDate() + 6);
                          const isCurrentWeek = wp.week_start_date === getCurrentAdminWeekStart();
                          return (
                            <div
                              key={wp.id}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                                isCurrentWeek
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border bg-background"
                              }`}
                            >
                              <div className="flex-shrink-0 w-16 text-center">
                                <div className={`text-xs font-bold ${isCurrentWeek ? "text-primary" : "text-muted-foreground"}`}>
                                  {format(new Date(wp.week_start_date + "T00:00:00"), "MMM d")}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  – {format(weekEnd, "MMM d")}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{wp.question}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{wp.category}</span>
                                  {isCurrentWeek && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold uppercase">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
                                onClick={() => handleDeleteWeeklyPoll(wp.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Poll Calendar
                      </h3>
                      <Calendar
                        mode="single"
                        selected={selectedCalendarDate}
                        onSelect={setSelectedCalendarDate}
                        className="p-3 pointer-events-auto"
                        modifiers={{ scheduled: scheduledDates, weekly: weeklyStartDates }}
                        modifiersClassNames={{
                          scheduled: "bg-primary/20 text-primary font-bold",
                          weekly: "ring-2 ring-purple-500/50 ring-offset-1 ring-offset-background",
                        }}
                      />
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-primary/20" />
                          <span>Daily poll</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm ring-2 ring-purple-500/50" />
                          <span>Weekly start</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="font-semibold text-foreground mb-3">
                        {selectedDateStr
                          ? format(selectedCalendarDate!, "MMMM d, yyyy")
                          : "Select a date"}
                      </h3>

                      {/* Show weekly poll info if applicable */}
                      {weeklyForDate && (
                        <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                              Weekly Challenge
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{weeklyForDate.question}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {weeklyForDate.options.map((opt) => (
                              <span key={opt.id} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{opt.label}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDateStr && pollsForDate.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground mb-3">
                            No polls scheduled for this date.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewDate(selectedDateStr);
                              setShowCreateForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Poll for This Date
                          </Button>
                        </div>
                      )}

                      {pollsForDate.length > 0 && (
                        <div className="space-y-3">
                          {pollsForDate.map((poll) => (
                            <div
                              key={poll.id}
                              className={`rounded-lg border p-3 ${
                                poll.status === "rejected"
                                  ? "border-destructive/30 bg-destructive/5 opacity-60"
                                  : poll.needs_review
                                  ? "border-accent/40 bg-accent/5"
                                  : "border-border bg-background"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                  {poll.category}
                                </span>
                                {poll.needs_review && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold uppercase">
                                    Needs Review
                                  </span>
                                )}
                                {poll.status === "approved" && !poll.needs_review && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold uppercase">
                                    Approved
                                  </span>
                                )}
                                {poll.status === "rejected" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold uppercase">
                                    Rejected
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-foreground text-sm">
                                {poll.question}
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {poll.options.map((opt) => (
                                  <span
                                    key={opt.id}
                                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground"
                                  >
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => startEdit(poll)}
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(poll.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => {
                              setNewDate(selectedDateStr);
                              setShowCreateForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Poll
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="admins">
            <div className="space-y-6">
              {/* Add admin */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Admin
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="Enter phone number (e.g. +1234567890)"
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    onClick={handleAddAdmin}
                    disabled={addingAdmin || !newAdminPhone.trim()}
                    size="sm"
                  >
                    {addingAdmin ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>

              {/* Admins list */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-3">
                  Current Admins
                </h3>
                {loadingAdmins ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No admins configured yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {admin.phone}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                            {admin.role}
                          </span>
                          {admin.user_id === user?.id && (
                            <span className="text-[10px] text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Remove admin"
                          onClick={() =>
                            handleRemoveAdmin(admin.id, admin.user_id)
                          }
                          disabled={admin.user_id === user?.id}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
