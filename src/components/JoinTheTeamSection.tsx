import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Users, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

const applicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please enter your name" })
    .max(120, { message: "Name must be under 120 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .max(255, { message: "Email must be under 255 characters" }),
  description: z
    .string()
    .trim()
    .min(20, { message: "Tell us a bit more (at least 20 characters)" })
    .max(2000, { message: "Please keep it under 2,000 characters" }),
});

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

export const JoinTheTeamSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setDescription("");
    setResume(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setResume(null);
      return;
    }
    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      toast.error("Resume must be a PDF or Word document");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be 5 MB or smaller");
      e.target.value = "";
      return;
    }
    setResume(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = applicationSchema.safeParse({ name, email, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }

    setSubmitting(true);
    try {
      let resume_path: string | null = null;
      let resume_filename: string | null = null;

      if (resume) {
        const ext = resume.name.includes(".") ? resume.name.split(".").pop() : "bin";
        const path = `applications/${crypto.randomUUID()}-${sanitizeFilename(resume.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("job-resumes")
          .upload(path, resume, {
            contentType: resume.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        resume_path = path;
        resume_filename = resume.name;
        void ext;
      }

      const { error: insertError } = await supabase.from("job_applications").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        description: parsed.data.description,
        resume_path,
        resume_filename,
      });
      if (insertError) throw insertError;

      toast.success("Thanks! Your application has been submitted.");
      reset();
    } catch (err) {
      console.error("Job application submission failed", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section data-section="team" className="container mx-auto px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-gold/30 bg-gradient-to-br from-navy-deep via-navy to-navy-deep p-8 sm:p-12 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_70%_20%,hsl(45,100%,60%/0.4),transparent_60%)]" />
        <div className="relative grid md:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 mb-4">
              <Users className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-semibold tracking-wide text-gold uppercase">Join the team</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[hsl(45,100%,96%)] mb-3">
              Join a team building <span className="text-gradient-gold">something the world has never seen.</span>
            </h2>
            <p className="text-[hsl(45,100%,96%)]/75 leading-relaxed">
              We're a small team with a big mission. Send us your resume and a short note on how you'd make an impact at One World — we read every submission.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jt-name" className="text-[hsl(45,100%,96%)]/80 text-xs uppercase tracking-wide">Name</Label>
                <Input
                  id="jt-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                  className="bg-[hsl(45,100%,96%)]/5 border-gold/30 text-[hsl(45,100%,96%)] placeholder:text-[hsl(45,100%,96%)]/40 focus-visible:ring-gold/40"
                  placeholder="Your full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jt-email" className="text-[hsl(45,100%,96%)]/80 text-xs uppercase tracking-wide">Email</Label>
                <Input
                  id="jt-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                  className="bg-[hsl(45,100%,96%)]/5 border-gold/30 text-[hsl(45,100%,96%)] placeholder:text-[hsl(45,100%,96%)]/40 focus-visible:ring-gold/40"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jt-desc" className="text-[hsl(45,100%,96%)]/80 text-xs uppercase tracking-wide">
                How will you make an impact?
              </Label>
              <Textarea
                id="jt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
                rows={5}
                placeholder="Briefly tell us about your background and how you'd contribute to One World."
                className="bg-[hsl(45,100%,96%)]/5 border-gold/30 text-[hsl(45,100%,96%)] placeholder:text-[hsl(45,100%,96%)]/40 focus-visible:ring-gold/40 resize-none"
              />
              <span className="text-[10px] text-[hsl(45,100%,96%)]/50 text-right">{description.length}/2000</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jt-resume" className="text-[hsl(45,100%,96%)]/80 text-xs uppercase tracking-wide">
                Resume (PDF or Word, max 5MB)
              </Label>
              <label
                htmlFor="jt-resume"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-dashed border-gold/40 bg-[hsl(45,100%,96%)]/5 cursor-pointer hover:bg-gold/10 transition-colors text-[hsl(45,100%,96%)]/80 text-sm"
              >
                <Upload className="w-4 h-4 text-gold" />
                <span className="truncate">
                  {resume ? resume.name : "Click to upload your resume"}
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="jt-resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="bg-gold text-navy-deep hover:bg-gold/90 font-semibold gap-2 h-12 rounded-full shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </section>
  );
};
