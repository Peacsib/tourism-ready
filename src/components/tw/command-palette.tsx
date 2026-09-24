import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Briefcase, CalendarDays, FileText, IdCard, UserRound, Workflow } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ARTICLES, COMPETENCIES, COURSES, HUBS, SIMULATIONS } from "@/lib/data";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const go = (fn: () => void) => { onOpenChange(false); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search people, skills, courses, simulations, reports…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results. Try "reservation", "Kariba" or "AI".</CommandEmpty>
        <CommandGroup heading="Simulations">
          {SIMULATIONS.map((s) => (
            <CommandItem key={s.id} value={`sim ${s.title} ${s.category}`} onSelect={() => go(() => s.available ? navigate({ to: "/app/simulations/$id", params: { id: s.id } }) : navigate({ to: "/app/simulations" }))}>
              <Workflow className="text-gold" /> {s.title}<span className="ml-auto text-xs text-muted-foreground">{s.category}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Skills">
          {COMPETENCIES.map((c) => (
            <CommandItem key={c.id} value={`skill ${c.name} ${c.category}`} onSelect={() => go(() => navigate({ to: "/app/passport" }))}>
              <IdCard className="text-cyan" /> {c.name}<span className="ml-auto text-xs text-muted-foreground">{c.state}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Courses">
          {COURSES.map((c) => (
            <CommandItem key={c.id} value={`course ${c.title} ${c.category}`} onSelect={() => go(() => navigate({ to: "/app/learning" }))}>
              <BookOpen /> {c.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Industry reports">
          {ARTICLES.map((a) => (
            <CommandItem key={a.id} value={`report ${a.title} ${a.category}`} onSelect={() => go(() => navigate({ to: "/app/intelligence" }))}>
              <FileText /> <span className="truncate">{a.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Events & Hubs">
          {HUBS.map((h) => (
            <CommandItem key={h.id} value={`event ${h.programme} ${h.destination}`} onSelect={() => go(() => navigate({ to: "/app/hubs" }))}>
              <CalendarDays /> {h.programme}<span className="ml-auto text-xs text-muted-foreground">{h.destination} · {h.next}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
