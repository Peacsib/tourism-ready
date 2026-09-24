import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Competency } from "@/lib/data";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="6" cy="24" r="3" className="fill-muted-foreground" />
        <circle cx="16" cy="16" r="3" className="fill-cyan" />
        <circle cx="26" cy="8" r="3.5" className="fill-gold" />
        <path d="M6 24 L16 16 L26 8" className="stroke-foreground/40" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        Tourism Workforce <span className="text-gold">2031</span>
      </span>
    </span>
  );
}

export const STAGES = ["Learn", "Practise", "Prove", "Connect", "Discover"] as const;

/** Motif 1 — Workforce Readiness Path. */
export function ReadinessPath({ active = 2, progress = 0.5, compact = false }: { active?: number; progress?: number; compact?: boolean }) {
  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="grow-x absolute left-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-cyan to-gold"
          style={{ width: `calc((100% - 1.5rem) * ${Math.min(1, (active + progress) / (STAGES.length - 1))})` }}
        />
        {STAGES.map((s, i) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border bg-background transition-colors",
                i < active && "border-gold bg-gold",
                i === active && "border-gold ring-4 ring-gold/15",
                i > active && "border-border",
              )}
            >
              {i === active && <span className="h-2 w-2 rounded-full bg-gold" />}
            </span>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 flex justify-between">
          {STAGES.map((s, i) => (
            <span key={s} className={cn("eyebrow w-16 text-center first:text-left last:text-right", i <= active && "text-foreground")}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const stateColor: Record<Competency["state"], string> = {
  Developing: "fill-muted-foreground",
  Practising: "fill-cyan",
  Demonstrated: "fill-gold/70",
  Verified: "fill-gold",
};

/** Motif 2 — Skills Constellation. */
export function SkillsConstellation({
  competencies,
  selected,
  onSelect,
  className,
}: {
  competencies: Competency[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const nodes = useMemo(() => {
    const cats = Array.from(new Set(competencies.map((c) => c.category)));
    return competencies.map((c, i) => {
      const ci = cats.indexOf(c.category);
      const inCat = competencies.filter((x) => x.category === c.category);
      const k = inCat.indexOf(c);
      const angle = (ci / cats.length) * Math.PI * 2 - Math.PI / 2 + (k - (inCat.length - 1) / 2) * 0.32;
      const radius = 30 + ((i * 7) % 11);
      return { ...c, x: 50 + Math.cos(angle) * radius * 1.35, y: 50 + Math.sin(angle) * radius };
    });
  }, [competencies]);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className={cn("h-full w-full", className)} role="img" aria-label="Skills constellation">
      {nodes.flatMap((n) =>
        n.links
          .filter((l) => byId[l] && n.id < l)
          .map((l) => (
            <line
              key={n.id + l}
              x1={n.x}
              y1={n.y}
              x2={byId[l].x}
              y2={byId[l].y}
              className={cn("stroke-foreground/10 transition-all", (selected === n.id || selected === l) && "stroke-gold/60")}
              strokeWidth={0.25}
            />
          )),
      )}
      {nodes.map((n) => (
        <g key={n.id} className={cn(onSelect && "cursor-pointer")} onClick={() => onSelect?.(n.id)}>
          <circle cx={n.x} cy={n.y} r={1.2 + n.level / 40} className={cn(stateColor[n.state], "opacity-20")} />
          <circle cx={n.x} cy={n.y} r={0.7 + n.level / 90} className={cn(stateColor[n.state], "transition-all")} />
          {selected === n.id && <circle cx={n.x} cy={n.y} r={3.6} className="fill-none stroke-gold" strokeWidth={0.3} />}
          <text x={n.x} y={n.y + 4.8} textAnchor="middle" className={cn("fill-muted-foreground text-[2.1px]", selected === n.id && "fill-foreground")}>
            {n.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Motif 3 — Industry Signal bars. */
export function Signal({ value, className }: { value: number; className?: string }) {
  const bars = 12;
  const on = Math.round((value / 100) * bars);
  return (
    <div className={cn("flex h-5 items-end gap-[3px]", className)} aria-label={`Momentum ${value}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", i < on ? "bg-cyan" : "bg-border")}
          style={{ height: `${30 + (i / bars) * 70}%`, opacity: i < on ? 0.45 + (i / bars) * 0.55 : 1 }}
        />
      ))}
    </div>
  );
}

export function Meter({ value, tone = "gold" }: { value: number; tone?: "gold" | "cyan" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("grow-x h-full rounded-full", tone === "gold" ? "bg-gold" : "bg-cyan")} style={{ width: `${value}%` }} />
    </div>
  );
}

export function StatePill({ state }: { state: Competency["state"] }) {
  const map = {
    Developing: "border-border text-muted-foreground",
    Practising: "border-cyan/30 text-cyan",
    Demonstrated: "border-gold/30 text-gold/90",
    Verified: "border-gold/50 bg-gold/10 text-gold",
  } as const;
  return <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", map[state])}>{state}</span>;
}

export function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "gold" | "cyan" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px]",
        tone === "default" && "border-border bg-surface-2 text-muted-foreground",
        tone === "gold" && "border-gold/30 bg-gold/10 text-gold",
        tone === "cyan" && "border-cyan/30 bg-cyan/10 text-cyan",
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <header className="fade-up mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold uppercase tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border bg-card p-5 shadow-[0_1px_2px_oklch(0.3_0.05_262/6%)] backdrop-blur-sm md:p-6", className)}>{children}</section>;
}

export function Avatar({ initials, size = "md", tone = "default" }: { initials: string; size?: "sm" | "md" | "lg" | "xl"; tone?: "default" | "gold" }) {
  const s = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" }[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-display font-semibold",
        s,
        tone === "gold" ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-surface-2 text-foreground",
      )}
    >
      {initials}
    </span>
  );
}
