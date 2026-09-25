import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, GraduationCap, Lightbulb, Presentation, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Logo } from "@/components/tw/motifs";
import { PERSONAS, ROLES, type RoleId } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: "Welcome to your workforce journey — Tourism Workforce 2031" },
      { name: "description", content: "Choose your role or a demo persona to enter the Tourism Workforce 2031 ecosystem." },
      { property: "og:title", content: "Welcome to your workforce journey" },
      { property: "og:description", content: "Personalised entry for students, professionals, employers, educators and entrepreneurs." },
    ],
  }),
  component: Start,
});

const ICONS: Record<RoleId, typeof GraduationCap> = {
  student: GraduationCap,
  professional: UserRound,
  employer: Briefcase,
  educator: Presentation,
  entrepreneur: Lightbulb,
};

function Start() {
  const { enter } = useApp();
  const { loading, user, profile, setProfileRole } = useAuth();
  const [role, setRole] = useState<RoleId | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.role) setRole(profile.role as RoleId);
  }, [profile?.role]);

  const go = async (personaId: string, r?: RoleId) => {
    enter(personaId, r);
    if (r) await setProfileRole(r);
    navigate({ to: "/app" });
  };

  const continueWithRole = () => {
    if (!role) return;
    const persona = PERSONAS.find((p) => p.role === role) ?? PERSONAS[0]!;
    void go(persona.id, role);
  };

  return (
    <div className="relative min-h-screen">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>

        <div className="fade-up mt-16 text-center">
          <p className="eyebrow">Step 1 of 1</p>
          <h1 className="mt-3 text-3xl font-semibold uppercase md:text-5xl">Welcome to your workforce journey</h1>
          <p className="mt-4 text-muted-foreground">What best describes you? We'll shape your dashboard around it.</p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ROLES.map((r) => {
            const Icon = ICONS[r.id];
            const on = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                aria-pressed={on}
                className={cn("lift flex flex-col rounded-2xl border bg-card p-5 text-left", on && "border-gold/60 bg-gold/5 ring-1 ring-gold/40")}
              >
                <Icon className={cn("h-5 w-5", on ? "text-gold" : "text-muted-foreground")} strokeWidth={1.5} />
                <span className="mt-6 font-display font-semibold">{r.label}</span>
                <span className="mt-2 text-sm text-muted-foreground">{r.blurb}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <Button size="lg" className="h-12 px-8" disabled={!role} onClick={continueWithRole}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
