import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { ProfileView } from "@/components/tw/profile-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BADGES } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Tourism Workforce 2031" },
      { name: "description", content: "Your professional profile and verified capability." },
      { property: "og:title", content: "Your professional profile" },
      { property: "og:description", content: "Verified competencies, simulation evidence and career milestones." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { persona, competencies, timeline, attempts, connections } = useApp();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <EditDetails />
      </div>
      <ProfileView
        own
        p={{
          initials: persona.initials,
          name: persona.name,
          role: persona.title,
          organisation: persona.organisation,
          location: persona.location,
          statement: persona.statement,
          competencies: competencies.filter((c) => c.state !== "Developing"),
          experience: timeline.filter((t) => t.type !== "Simulation").map((t) => ({ title: t.title, detail: t.detail, date: t.date })),
          simulations: ["Guest Check-in · Verified", ...attempts.map((a) => `${a.title} · ${a.addedToPassport ? "On passport" : "Completed"}`)],
          development: ["Field Hub: Victoria Falls Readiness Clinic", "Hotel Operations Fundamentals (67%)"],
          interests: ["AI in hospitality", "Front office", "Sustainable tourism"],
          connections: connections.length + 38,
          achievements: BADGES.map((b) => `${b.name} · ${b.tier}`),
        }}
      />
    </div>
  );
}

function EditDetails() {
  const { profile, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    headline: profile?.headline ?? "",
    organisation: profile?.organisation ?? "",
    location: profile?.location ?? "",
    goal: profile?.goal ?? "",
    bio: profile?.bio ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile(form);
      toast.success("Profile saved");
      setOpen(false);
    } catch {
      toast.error("Could not save your profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="mr-2 h-3.5 w-3.5" /> Edit details</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Your details</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={form.full_name} onChange={set("full_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-headline">Title</Label>
            <Input id="p-headline" value={form.headline} onChange={set("headline")} placeholder="Front Office Trainee" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-org">Organisation</Label>
              <Input id="p-org" value={form.organisation} onChange={set("organisation")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-loc">Location</Label>
              <Input id="p-loc" value={form.location} onChange={set("location")} placeholder="Victoria Falls, Zimbabwe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-goal">Career goal</Label>
            <Input id="p-goal" value={form.goal} onChange={set("goal")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-bio">About you</Label>
            <Textarea id="p-bio" rows={4} value={form.bio} onChange={set("bio")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
