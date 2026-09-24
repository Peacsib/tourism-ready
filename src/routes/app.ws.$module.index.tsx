import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWorkspaceId, WORKSPACES } from "@/lib/workspaces";
import { newId, upsertThread } from "@/lib/ws-threads";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ws/$module/")({
  beforeLoad: ({ params }) => { if (!isWorkspaceId(params.module)) throw notFound(); },
  head: ({ params }) => {
    const w = isWorkspaceId(params.module) ? WORKSPACES[params.module] : null;
    const t = `${w?.agent ?? "Workspace"} — Tourism Workforce 2031`;
    const d = w?.welcomeBody ?? "AI workspace";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
  },
  component: Onboarding,
});

function Onboarding() {
  const { module } = Route.useParams();
  const w = WORKSPACES[module as keyof typeof WORKSPACES];
  const { user } = useAuth();
  const { persona } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [own, setOwn] = useState(false);
  const [custom, setCustom] = useState("");

  const start = () => {
    const f = focus?.trim().slice(0, 120);
    if (!user || !f) return;
    const id = newId();
    upsertThread(user.id, { id, module: w.id, title: `${f} session`, focus: f, updatedAt: Date.now(), messages: [] });
    navigate({ to: "/app/ws/$module/$threadId", params: { module: w.id, threadId: id } });
  };

  return (
    <div className="relative -mx-4 -my-8 flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-10 md:-mx-8 md:-my-10">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border bg-background/80 shadow-2xl backdrop-blur-xl md:grid-cols-[1fr_1.15fr]">
        {/* Agent identity */}
        <div className="relative flex flex-col justify-between gap-8 border-b bg-gradient-to-br from-cyan/10 via-background to-gold/10 p-8 md:border-b-0 md:border-r md:p-10">
          <div>
            <div className="relative inline-flex">
              <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-cyan/20 [animation-duration:3s]" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl border bg-background shadow-lg">
                {w.logo ? <img src={w.logo} alt={`${w.agent} logo`} width={64} height={64} className="h-14 w-14 object-contain" /> : <w.icon className="h-9 w-9 text-foreground" strokeWidth={1.4} />}
              </span>
            </div>
            <p className="eyebrow mt-6">{w.label}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl"><span className="text-gradient">{w.agent}</span></h1>
            <p className="mt-3 text-lg text-muted-foreground">{w.tagline}</p>
          </div>
          <ul className="space-y-3">
            {w.capabilities.map((c, i) => (
              <li key={c} className="fade-up flex items-start gap-3 text-sm" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15"><Check className="h-3 w-3 text-gold" /></span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="flex flex-col p-8 md:p-10">
          <div className="flex items-center gap-2">
            {[0, 1].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i <= step ? "bg-gold" : "bg-border")} />)}
          </div>
          <div key={step} className="fade-up flex flex-1 flex-col pt-8">
            {step === 0 ? (
              <>
                <p className="text-sm text-muted-foreground">Mhoro, {persona.firstName} 👋</p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{w.welcomeTitle}</h2>
                <p className="mt-4 text-muted-foreground">{w.welcomeBody}</p>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                  {[["Live", "real-time replies"], ["Personal", "uses your passport"], ["Private", "your chats only"]].map(([a, b]) => (
                    <div key={a} className="rounded-2xl border bg-surface/60 p-3">
                      <p className="font-display text-sm font-semibold">{a}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{b}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-10">
                  <Button size="lg" className="w-full" onClick={() => setStep(1)}>Get started <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Personalise {w.agent}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{w.chipQuestion}</h2>
                <div className="mt-6 space-y-3">
                  {w.chips.map((c, i) => (
                    <button key={c} onClick={() => { setOwn(false); setFocus(c); }}
                      className={cn("fade-up flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all",
                        !own && focus === c ? "border-gold bg-gold/10 shadow-md" : "bg-background hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm")}
                      style={{ animationDelay: `${i * 70}ms` }}>
                      <span className="font-medium">{c}</span>
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border transition-colors", !own && focus === c ? "border-gold bg-gold text-background" : "")}>
                        {!own && focus === c && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                  <button onClick={() => { setOwn(true); setFocus("Open topic"); }}
                    className={cn("fade-up flex w-full items-center justify-between rounded-2xl border border-dashed px-5 py-4 text-left transition-all",
                      own ? "border-gold bg-gold/10 shadow-md" : "bg-background hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm")}
                    style={{ animationDelay: `${w.chips.length * 70}ms` }}>
                    <span className="flex items-center gap-2 font-medium"><PenLine className="h-4 w-4 text-cyan" /> I have my own topic</span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border transition-colors", own ? "border-gold bg-gold text-background" : "")}>
                      {own && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                </div>
                <div className="mt-auto flex gap-3 pt-10">
                  <Button variant="ghost" size="lg" onClick={() => setStep(0)}>Back</Button>
                  <Button size="lg" className="flex-1" disabled={!focus} onClick={start}>Start with {w.agent} <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
