import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Check, Loader2, MapPin, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Tag } from "@/components/tw/motifs";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { supabase } from "@/integrations/supabase/client";
import { displayName, fetchJobs, MEMBER_COLS, timeAgo, type Job, type Member } from "@/lib/social";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [
    { title: "Opportunities — Tourism Workforce 2031" },
    { name: "description", content: "Real jobs, internships and placements posted by tourism employers in Zimbabwe." },
    { property: "og:title", content: "Opportunities — Tourism Workforce 2031" },
    { property: "og:description", content: "Real jobs, internships and placements posted by tourism employers in Zimbabwe." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Opportunities,
});

const TYPES = ["Full-time", "Part-time", "Internship", "Attachment", "Seasonal", "Contract"];
type App = { id: string; job_id: string; applicant_id: string; note: string; status: string; created_at: string; passport: { name: string; state: string; level: number }[]; applicant?: Member | null };

function Opportunities() {
  const { user, profile } = useAuth();
  const { competencies } = useApp();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [mine, setMine] = useState<App[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [applyTo, setApplyTo] = useState<Job | null>(null);
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState<"browse" | "listings">("browse");
  const isEmployer = profile?.role === "employer" || profile?.role === "admin";
  const [syncing, setSyncing] = useState(false);
  const doRefreshJobs = useServerFn(refreshJobs);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [j, a] = await Promise.all([fetchJobs(), supabase.from("job_applications").select("id, job_id, applicant_id, note, status, created_at, passport").eq("applicant_id", user.id)]);
      setJobs(j); setMine((a.data ?? []) as unknown as App[]);
    } catch (e) { toast.error((e as Error).message); setJobs([]); }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const match = useCallback((j: Job) => {
    if (!j.skills.length) return null;
    const mine = competencies.map((c) => ({ n: c.name.toLowerCase(), lvl: c.level }));
    const hits = j.skills.map((s) => mine.find((m) => m.n.includes(s.toLowerCase().split(" ")[0]!) || s.toLowerCase().includes(m.n.split(" ")[0]!)));
    return Math.round(hits.reduce((t, h) => t + (h ? h.lvl : 0), 0) / j.skills.length);
  }, [competencies]);

  const list = useMemo(() => (jobs ?? []).filter((j) => j.active && (type === "all" || j.job_type === type)
    && `${j.title} ${j.organisation} ${j.location} ${j.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase())), [jobs, q, type]);
  const myListings = (jobs ?? []).filter((j) => j.employer_id === user?.id);

  return (
    <div>
      <PageHeader eyebrow="Careers" title="Opportunities" subtitle="Real tourism and hospitality jobs — posted by employers here, plus live listings found on Google Jobs."
        actions={<div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/app/ws/$module" params={{ module: "opportunities" }}><img src={nyanzviLogo} alt="" className="mr-1.5 h-4 w-4" /> Ask Nyanzvi Careers</Link></Button>
          {profile?.role === "admin" && <Button variant="outline" disabled={syncing} onClick={async () => {
            setSyncing(true);
            try { const r = await doRefreshJobs(); if (!r.ok) toast.error(r.error); else toast.success("Jobs refreshed", { description: `${r.report.queries_run} searches · ${r.report.relevant} relevant · ${r.report.inserted} new · ${r.report.updated} updated` }); await load(); }
            catch (e) { toast.error((e as Error).message); } finally { setSyncing(false); }
          }}><RefreshCw className={cn("mr-1 h-4 w-4", syncing && "animate-spin")} /> Refresh Jobs</Button>}
          {isEmployer && <Button onClick={() => setPosting(true)}><Plus className="mr-1 h-4 w-4" /> Post an opportunity</Button>}
        </div>} />

      {isEmployer && (
        <div className="mb-5 inline-flex rounded-full border bg-card p-1 text-sm">
          {(["browse", "listings"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t === "browse" ? "Browse" : `My listings (${myListings.length})`}</button>)}
        </div>
      )}

      {tab === "listings" && isEmployer ? <EmployerListings jobs={myListings} onChange={load} /> : <>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles, employers, skills or places" className="bg-surface pl-9" /></div>
          <div className="flex gap-1.5 overflow-x-auto">
            {["all", ...TYPES].map((t) => <button key={t} onClick={() => setType(t)} className={cn("shrink-0 rounded-full border px-3 py-1 text-xs", type === t ? "border-gold/50 bg-gold/10 text-foreground" : "text-muted-foreground")}>{t === "all" ? "All types" : t}</button>)}
          </div>
        </div>

        {jobs === null ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
          : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/60 p-10 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-display text-lg font-semibold">{jobs.length === 0 ? "No opportunities posted yet" : "No opportunities match"}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{jobs.length === 0 ? "Employers on Tourism Workforce 2031 post real roles here. While you wait, Nyanzvi Careers can help you prepare applications and practise interviews." : "Try another search or type."}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button asChild variant="outline"><Link to="/app/ws/$module" params={{ module: "opportunities" }}>Prepare with Nyanzvi</Link></Button>
                {isEmployer && jobs.length === 0 && <Button onClick={() => setPosting(true)}>Be the first employer to post</Button>}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {list.map((j) => {
                const app = mine.find((a) => a.job_id === j.id);
                const m = match(j);
                return (
                  <div key={j.id} className="grid gap-4 border-b p-5 last:border-b-0 hover:bg-surface/60 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><Tag tone="cyan">{j.job_type}</Tag><span className="text-xs text-muted-foreground">Posted {timeAgo(j.created_at)}{j.closes_on ? ` · Closes ${new Date(j.closes_on).toLocaleDateString()}` : ""}</span></div>
                      <p className="mt-2 font-display text-lg font-semibold">{j.title}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">{j.organisation} · <MapPin className="h-3 w-3" />{j.location}</p>
                      {j.description && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{j.description}</p>}
                      {j.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{j.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>}
                    </div>
                    <div className="flex items-center gap-4 md:flex-col md:items-end">
                      {m !== null && <div className="text-right"><p className="font-display text-2xl font-semibold text-gold">{m}%</p><p className="eyebrow">Passport match</p></div>}
                      {j.is_external ? <>
                          <Tag>External job · via Google Jobs</Tag>
                          {j.apply_url && <Button asChild size="sm"><a href={j.apply_url} target="_blank" rel="noreferrer">Apply on employer site</a></Button>}
                        </>
                        : j.employer_id === user?.id ? <Tag>Your listing</Tag>
                        : app ? <Button size="sm" variant="outline" disabled><Check className="mr-1 h-3.5 w-3.5" /> {app.status === "submitted" ? "Applied" : app.status[0]!.toUpperCase() + app.status.slice(1)}</Button>
                        : <Button size="sm" onClick={() => setApplyTo(j)}>Apply with Passport</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </>}

      <ApplyDialog job={applyTo} onClose={() => setApplyTo(null)} onDone={load} />
      <PostJobDialog open={posting} onClose={() => setPosting(false)} onDone={() => { load(); setTab("listings"); }} />
    </div>
  );
}

function ApplyDialog({ job, onClose, onDone }: { job: Job | null; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const { competencies } = useApp();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const top = [...competencies].sort((a, b) => b.level - a.level).slice(0, 8);
  const submit = async () => {
    if (!user || !job) return;
    setBusy(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: job.id, applicant_id: user.id, note: note.trim().slice(0, 2000),
      passport: competencies.map((c) => ({ name: c.name, state: c.state, level: c.level })),
    });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "You've already applied." : error.message); return; }
    toast.success("Application sent with your Skills Passport"); setNote(""); onClose(); onDone();
  };
  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Apply: {job?.title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{job?.organisation} will see your profile, this note and your Skills Passport.</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Why you're a great fit (optional)" className="min-h-28" />
        <div className="rounded-xl border bg-surface/60 p-3">
          <p className="eyebrow mb-2">Passport attached</p>
          <div className="flex flex-wrap gap-1.5">{top.map((c) => <Tag key={c.id} tone={c.state === "Verified" ? "gold" : "default"}>{c.name} · {c.level}%</Tag>)}</div>
        </div>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Send application</Button></div>
      </DialogContent>
    </Dialog>
  );
}

const jobSchema = z.object({
  title: z.string().trim().min(3, "Add a job title").max(120),
  organisation: z.string().trim().min(2, "Add the organisation").max(120),
  location: z.string().trim().min(2).max(120),
  job_type: z.string(),
  description: z.string().trim().max(4000),
  skills: z.array(z.string().trim().min(1).max(60)).max(12),
  closes_on: z.string().nullable(),
});

function PostJobDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [f, setF] = useState({ title: "", organisation: "", location: "Zimbabwe", job_type: "Full-time", description: "", skills: "", closes_on: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open && profile?.organisation) setF((v) => ({ ...v, organisation: v.organisation || profile.organisation! })); }, [open, profile]);
  const submit = async () => {
    if (!user) return;
    const parsed = jobSchema.safeParse({ ...f, skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean), closes_on: f.closes_on || null });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.from("jobs").insert({ ...parsed.data, employer_id: user.id });
    setBusy(false);
    if (error) { toast.error(error.message.includes("row-level") ? "Only employer accounts can post opportunities." : error.message); return; }
    toast.success("Opportunity published"); onClose(); onDone();
    setF({ title: "", organisation: profile?.organisation ?? "", location: "Zimbabwe", job_type: "Full-time", description: "", skills: "", closes_on: "" });
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Post an opportunity</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input value={f.title} onChange={set("title")} placeholder="Job title, e.g. Front Office Supervisor" maxLength={120} />
          <div className="grid grid-cols-2 gap-3">
            <Input value={f.organisation} onChange={set("organisation")} placeholder="Organisation" maxLength={120} />
            <Input value={f.location} onChange={set("location")} placeholder="Location" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={f.job_type} onChange={set("job_type")} className="h-9 rounded-md border bg-background px-2 text-sm">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <Input type="date" value={f.closes_on} onChange={set("closes_on")} aria-label="Closing date" />
          </div>
          <Textarea value={f.description} onChange={set("description")} maxLength={4000} placeholder="What the role involves and who you're looking for" className="min-h-28" />
          <Input value={f.skills} onChange={set("skills")} placeholder="Skills, comma separated (e.g. Reservations, Guest Service)" />
        </div>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Publish</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function EmployerListings({ jobs, onChange }: { jobs: Job[]; onChange: () => void }) {
  const [apps, setApps] = useState<App[]>([]);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!jobs.length) { setApps([]); return; }
    const { data } = await supabase.from("job_applications").select(`id, job_id, applicant_id, note, status, created_at, passport, applicant:profiles!job_applications_applicant_id_fkey(${MEMBER_COLS})`).in("job_id", jobs.map((j) => j.id)).order("created_at", { ascending: false });
    setApps((data ?? []) as unknown as App[]);
  }, [jobs]);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Marked ${status}`); load(); }
  };
  const toggleActive = async (j: Job) => {
    const { error } = await supabase.from("jobs").update({ active: !j.active }).eq("id", j.id);
    if (error) toast.error(error.message); else onChange();
  };
  if (!jobs.length) return <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">You haven't posted any opportunities yet.</p>;
  return (
    <div className="space-y-3">
      {jobs.map((j) => {
        const list = apps.filter((a) => a.job_id === j.id);
        return (
          <div key={j.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1"><p className="font-display font-semibold">{j.title}</p><p className="text-xs text-muted-foreground">{j.job_type} · {j.location} · {j.active ? "Open" : "Closed"}</p></div>
              <Button size="sm" variant="outline" onClick={() => setOpenJob(openJob === j.id ? null : j.id)}><Users className="mr-1 h-3.5 w-3.5" /> {list.length} applicant{list.length === 1 ? "" : "s"}</Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(j)}>{j.active ? "Close" : "Reopen"}</Button>
            </div>
            {openJob === j.id && (
              <ul className="mt-4 divide-y border-t">
                {list.length === 0 && <li className="py-3 text-sm text-muted-foreground">No applicants yet.</li>}
                {list.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar m={a.applicant} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link to="/app/people/$id" params={{ id: a.applicant_id }} className="text-sm font-medium hover:underline">{displayName(a.applicant)}</Link>
                        <p className="text-xs text-muted-foreground">{a.applicant?.headline ?? ""} · applied {timeAgo(a.created_at)} · <span className="font-medium text-foreground">{a.status}</span></p>
                      </div>
                      <Button size="sm" variant="outline" asChild><Link to="/app/messages" search={{ to: a.applicant_id }}>Message</Link></Button>
                      <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">{["submitted", "shortlisted", "declined", "hired"].map((s) => <option key={s}>{s}</option>)}</select>
                    </div>
                    {a.note && <p className="ml-12 mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.note}</p>}
                    <div className="ml-12 mt-2 flex flex-wrap gap-1.5">{[...a.passport].sort((x, y) => y.level - x.level).slice(0, 6).map((s) => <Tag key={s.name} tone={s.state === "Verified" ? "gold" : "default"}>{s.name} · {s.level}%</Tag>)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
