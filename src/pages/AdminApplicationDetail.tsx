import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Save,
  ShieldAlert,
  History,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Status = "new" | "in_review" | "shortlisted" | "rejected" | "hired";

interface JobApplication {
  id: string;
  name: string;
  email: string;
  description: string;
  resume_path: string | null;
  resume_filename: string | null;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewEntry {
  id: string;
  reviewer_id: string | null;
  previous_status: Status | null;
  new_status: Status | null;
  note: string | null;
  created_at: string;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  in_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  shortlisted: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  hired: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const statusLabel = (s: Status | null) =>
  s ? STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s : "—";

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  const [app, setApp] = useState<JobApplication | null>(null);
  const [history, setHistory] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const isPdf = useMemo(() => {
    const name = app?.resume_filename?.toLowerCase() ?? "";
    const path = app?.resume_path?.toLowerCase() ?? "";
    return name.endsWith(".pdf") || path.endsWith(".pdf");
  }, [app]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: appData, error: appErr }, { data: hist, error: histErr }] =
      await Promise.all([
        supabase.from("job_applications").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("job_application_reviews")
          .select("*")
          .eq("application_id", id)
          .order("created_at", { ascending: false }),
      ]);
    if (appErr || !appData) {
      toast.error("Application not found");
      navigate("/admin");
      return;
    }
    if (histErr) console.error(histErr);
    const typedApp = appData as JobApplication;
    setApp(typedApp);
    setHistory((hist ?? []) as ReviewEntry[]);
    setNotesDraft(typedApp.admin_notes ?? "");
    setLoading(false);
  };

  const loadResume = async (path: string) => {
    setResumeLoading(true);
    const { data, error } = await supabase.storage
      .from("job-resumes")
      .createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Failed to load resume");
    } else {
      setResumeUrl(data.signedUrl);
    }
    setResumeLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, id]);

  useEffect(() => {
    if (app?.resume_path) loadResume(app.resume_path);
  }, [app?.resume_path]);

  const updateStatus = async (status: Status) => {
    if (!app) return;
    const prev = app.status;
    setApp({ ...app, status });
    const { error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", app.id);
    if (error) {
      toast.error("Failed to update status");
      setApp({ ...app, status: prev });
    } else {
      toast.success(`Status set to "${statusLabel(status)}"`);
      // Refresh history to show the auto-logged entry
      const { data } = await supabase
        .from("job_application_reviews")
        .select("*")
        .eq("application_id", app.id)
        .order("created_at", { ascending: false });
      setHistory((data ?? []) as ReviewEntry[]);
    }
  };

  const saveNotes = async () => {
    if (!app) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("job_applications")
      .update({ admin_notes: notesDraft })
      .eq("id", app.id);
    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      setApp({ ...app, admin_notes: notesDraft });
    }
    setSavingNotes(false);
  };

  const postComment = async () => {
    if (!app || !user) return;
    const note = newComment.trim();
    if (!note) return;
    setPostingComment(true);
    const { data, error } = await supabase
      .from("job_application_reviews")
      .insert({
        application_id: app.id,
        reviewer_id: user.id,
        note,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add comment");
    } else {
      setHistory((h) => [data as ReviewEntry, ...h]);
      setNewComment("");
      toast.success("Comment added");
    }
    setPostingComment(false);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Admins only</h1>
          <p className="text-muted-foreground mb-6">You don't have access to this page.</p>
          <Button onClick={() => navigate("/")}>Go home</Button>
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl font-bold text-foreground">{app.name}</h1>
              <Badge variant="outline" className={STATUS_STYLES[app.status]}>
                {statusLabel(app.status)}
              </Badge>
            </div>
            <a
              href={`mailto:${app.email}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {app.email}
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              Submitted {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Select value={app.status} onValueChange={(v) => updateStatus(v as Status)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Impact statement</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                {app.description}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-display text-lg font-semibold">Resume</h2>
                {app.resume_path && resumeUrl && (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4" />
                      {app.resume_filename || "Download"}
                    </a>
                  </Button>
                )}
              </div>
              {!app.resume_path ? (
                <p className="text-sm text-muted-foreground">
                  No resume was attached to this application.
                </p>
              ) : resumeLoading || !resumeUrl ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : isPdf ? (
                <iframe
                  src={resumeUrl}
                  title={app.resume_filename || "Resume"}
                  className="w-full h-[720px] rounded-md border border-border bg-card"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-card/50">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground/90 flex-1 truncate">
                    {app.resume_filename || "Resume file"}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Admin notes</h2>
              <Textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                placeholder="Internal notes about this candidate..."
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={saveNotes}
                  disabled={savingNotes || notesDraft === (app.admin_notes ?? "")}
                  className="gap-2"
                >
                  {savingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save notes
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-5 h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Review history</h2>
            </div>

            <div className="space-y-3 mb-5">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Add a comment to the review history..."
                className="resize-none"
              />
              <Button
                size="sm"
                onClick={postComment}
                disabled={postingComment || !newComment.trim()}
                className="gap-2 w-full"
              >
                {postingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquarePlus className="w-4 h-4" />
                )}
                Add comment
              </Button>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No review activity yet.
              </p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-5">
                {history.map((entry) => {
                  const isStatusChange =
                    entry.previous_status !== null || entry.new_status !== null;
                  return (
                    <li key={entry.id} className="pl-4 relative">
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold border border-background" />
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {isStatusChange ? (
                        <p className="text-sm mt-1">
                          Status changed from{" "}
                          <Badge
                            variant="outline"
                            className={
                              entry.previous_status
                                ? STATUS_STYLES[entry.previous_status]
                                : ""
                            }
                          >
                            {statusLabel(entry.previous_status)}
                          </Badge>{" "}
                          to{" "}
                          <Badge
                            variant="outline"
                            className={
                              entry.new_status ? STATUS_STYLES[entry.new_status] : ""
                            }
                          >
                            {statusLabel(entry.new_status)}
                          </Badge>
                        </p>
                      ) : null}
                      {entry.note && (
                        <p className="text-sm mt-1.5 whitespace-pre-wrap text-foreground/90">
                          {entry.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
