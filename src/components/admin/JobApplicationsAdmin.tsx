import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, FileText, Download, RefreshCw, Trash2, Save } from "lucide-react";
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

export function JobApplicationsAdmin() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load applications");
      console.error(error);
    } else {
      setApps((data ?? []) as JobApplication[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

  const counts = useMemo(() => {
    const base: Record<Status | "all", number> = {
      all: apps.length,
      new: 0,
      in_review: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };
    for (const a of apps) base[a.status] += 1;
    return base;
  }, [apps]);

  const updateStatus = async (id: string, status: Status) => {
    const prev = apps;
    setApps((curr) => curr.map((a) => (a.id === id ? { ...a, status } : a)));
    const { error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      setApps(prev);
    } else {
      toast.success("Status updated");
    }
  };

  const saveNotes = async (id: string) => {
    setSavingId(id);
    const notes = notesDraft[id] ?? "";
    const { error } = await supabase
      .from("job_applications")
      .update({ admin_notes: notes })
      .eq("id", id);
    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      setApps((curr) => curr.map((a) => (a.id === id ? { ...a, admin_notes: notes } : a)));
      setNotesDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
    }
    setSavingId(null);
  };

  const downloadResume = async (app: JobApplication) => {
    if (!app.resume_path) return;
    setDownloadingId(app.id);
    const { data, error } = await supabase.storage
      .from("job-resumes")
      .createSignedUrl(app.resume_path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Failed to generate download link");
    } else {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
    setDownloadingId(null);
  };

  const deleteApp = async (app: JobApplication) => {
    if (!confirm(`Delete application from ${app.name}? This cannot be undone.`)) return;
    if (app.resume_path) {
      await supabase.storage.from("job-resumes").remove([app.resume_path]);
    }
    const { error } = await supabase.from("job_applications").delete().eq("id", app.id);
    if (error) {
      toast.error("Failed to delete application");
    } else {
      toast.success("Application deleted");
      setApps((curr) => curr.filter((a) => a.id !== app.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUS_OPTIONS.map((s) => s.value)] as const).map((value) => {
            const label =
              value === "all" ? "All" : STATUS_OPTIONS.find((s) => s.value === value)!.label;
            const active = filter === value;
            return (
              <Button
                key={value}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setFilter(value as Status | "all")}
                className="gap-2"
              >
                {label}
                <span className="text-xs opacity-70">({counts[value]})</span>
              </Button>
            );
          })}
        </div>
        <Button size="sm" variant="ghost" onClick={fetchApps} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No applications {filter !== "all" ? `with status "${filter}"` : "yet"}.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const draft = notesDraft[app.id];
            const notesValue = draft ?? app.admin_notes ?? "";
            const notesDirty = draft !== undefined && draft !== (app.admin_notes ?? "");
            return (
              <Card key={app.id} className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {app.name}
                      </h3>
                      <Badge variant="outline" className={STATUS_STYLES[app.status]}>
                        {STATUS_OPTIONS.find((s) => s.value === app.status)?.label}
                      </Badge>
                    </div>
                    <a
                      href={`mailto:${app.email}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {app.email}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={app.status}
                      onValueChange={(v) => updateStatus(app.id, v as Status)}
                    >
                      <SelectTrigger className="w-[160px]">
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteApp(app)}
                      aria-label="Delete application"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Impact statement
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {app.description}
                  </p>
                </div>

                {app.resume_path && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadResume(app)}
                      disabled={downloadingId === app.id}
                      className="gap-2"
                    >
                      {downloadingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <FileText className="w-4 h-4" />
                      {app.resume_filename || "View resume"}
                    </Button>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Admin notes
                  </p>
                  <Textarea
                    value={notesValue}
                    onChange={(e) =>
                      setNotesDraft((d) => ({ ...d, [app.id]: e.target.value }))
                    }
                    rows={3}
                    placeholder="Internal notes about this candidate..."
                    className="resize-none"
                  />
                  {notesDirty && (
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => saveNotes(app.id)}
                        disabled={savingId === app.id}
                        className="gap-2"
                      >
                        {savingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save notes
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
