import { createFileRoute } from "@tanstack/react-router";
import { Check, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Tag } from "@/components/tw/motifs";
import { HUBS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/hubs")({
  head: () => ({ meta: [{ title: "Field & Innovation Hubs — Tourism Workforce 2031" }, { name: "description", content: "Mobile Tourism Innovation Hubs taking training to Kariba, Mutoko and destinations across Zimbabwe." }] }),
  component: Hubs,
});

function Hubs() {
  const { hubRegistrations, registerHub } = useApp();
  const total = HUBS.reduce((t, h) => t + h.participants, 0);
  return (
    <div>
      <PageHeader eyebrow="Field programmes" title="Field & Innovation Hubs" subtitle="Mobile Tourism Innovation Hubs extend training into businesses, communities and remote destinations — connected to your digital Passport." />
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[["Destinations", HUBS.length], ["Participants", total], ["Community projects", HUBS.length]].map(([k, v]) => (
          <Panel key={k as string} className="p-4 md:p-5"><p className="font-display text-3xl font-semibold">{v}</p><p className="eyebrow mt-1">{k}</p></Panel>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {HUBS.map((h) => {
          const reg = hubRegistrations.includes(h.id);
          return (
            <div key={h.id} className="grid gap-4 border-b p-5 last:border-b-0 md:grid-cols-[180px_1fr_auto] md:items-center">
              <div><p className="flex items-center gap-1.5 font-display text-lg font-semibold"><MapPin className="h-4 w-4 text-gold" />{h.destination}</p><p className="font-mono text-xs text-muted-foreground">Next session · {h.next}</p></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{h.programme}</p><Tag tone={h.status === "Enrolling" ? "gold" : "default"}>{h.status}</Tag></div>
                <p className="text-sm text-muted-foreground">Training focus: {h.focus}</p>
                <p className="mt-1 text-sm"><span className="text-cyan">Community project · </span>{h.project}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{h.participants + (reg ? 1 : 0)}</span>
                <Button size="sm" variant={reg ? "outline" : "default"} disabled={reg || h.status === "Planning"} onClick={() => { registerHub(h.id); toast.success(`Registered for ${h.programme}`, { description: `${h.destination} · ${h.next}` }); }}>
                  {reg ? <><Check className="mr-1 h-3.5 w-3.5" /> Registered</> : h.status === "Planning" ? "Opens soon" : "Register"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
