import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWorkspaceId, WORKSPACES } from "@/lib/workspaces";
import { newId, upsertThread } from "@/lib/ws-threads";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ws/$module/")({
  beforeLoad: ({ params }) => { if (!isWorkspaceId(params.module)) throw notFound(); },
  head: ({ params }) => {
    const w = isWorkspaceId(params.module) ? WORKSPACES[params.module] : null;
    const t = `${w?.label ?? "Workspace"} — Tourism Workforce 2031`;
    const d = w?.welcomeBody ?? "AI workspace";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
  },
  component: Onboarding,
});

function Onboarding() {
  const { module } = Route.useParams();
  const w = WORKSPACES[module as keyof typeof WORKSPACES];
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);

  const start = () => {
    if (!user || !focus) return;
    const id = newId();
    upsertThread(user.id, { id, module: w.id, title: `${focus} session`, focus, updatedAt: Date.now(), messages: [] });
    navigate({ to: "/app/ws/$module/$threadId", params: { module: w.id, threadId: id } });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div key={step} className="fade-up glass w-full max-w-lg rounded-3xl border p-8 text-center shadow-xl md:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-gold/20">
          <w.icon className="h-7 w-7 text-foreground" strokeWidth={1.5} />
        </div>
        {step === 0 ? (
          <>
            <p className="eyebrow">{w.label}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold md:text-3xl">{w.welcomeTitle}</h1>
            <p className="mt-3 text-muted-foreground">{w.welcomeBody}</p>
            <Button className="mt-8" size="lg" onClick={() => setStep(1)}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </>
        ) : (
          <>
            <p className="eyebrow">Step 2 of 2</p>
            <h1 className="mt-2 font-display text-2xl font-semibold">{w.chipQuestion}</h1>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {w.chips.map((c) => (
                <button key={c} onClick={() => setFocus(c)}
                  className={cn("flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all",
                    focus === c ? "border-gold bg-gold/10 font-medium text-foreground" : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                  {focus === c && <Check className="h-3.5 w-3.5 text-gold" />}{c}
                </button>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button size="lg" disabled={!focus} onClick={start}>Start <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </>
        )}
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1].map((i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-gold" : "w-1.5 bg-border")} />)}
        </div>
        <Link to={w.classic} className="mt-6 inline-block text-xs text-muted-foreground hover:text-foreground">Or open the {w.classicLabel.toLowerCase()} →</Link>
      </div>
    </div>
  );
}
