import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel } from "@/components/tw/motifs";
import { toast } from "sonner";

export const Route = createFileRoute("/app/help")({
  head: () => ({ meta: [{ title: "Help & Support — Tourism Workforce 2031" }, { name: "description", content: "Answers and support for the Tourism Workforce 2031 platform." }] }),
  component: Help,
});

const FAQ = [
  ["How does a skill become 'Verified'?", "Complete a simulation, review the AI feedback and add it to your Skills Passport. Repeated strong performance moves a skill from Developing → Practising → Demonstrated → Verified."],
  ["Who can see my Skills Passport?", "Your connections and employers you apply to. You can share a link or download a copy at any time."],
  ["Is the AI Tutor always available?", "Yes. The tutor works in every session and adapts to your role, goal and recent simulation results."],
  ["How do I switch persona or role in demo mode?", "Use the role selector in the top bar, or choose 'Switch persona' from the account menu."],
  ["Can I use the command palette?", "Press ⌘K (or Ctrl+K) anywhere to search people, skills, courses, simulations, reports, opportunities and events."],
];

function Help() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || body.trim().length < 10) { setErr("Add a subject (3+ characters) and a short description (10+ characters)."); return; }
    setErr(null); setSubject(""); setBody("");
    toast.success("Support request sent — we'll reply within one working day.");
  };
  return (
    <div>
      <PageHeader eyebrow="Support" title="Help & Support" subtitle="Answers to common questions, and a direct line to the platform team." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </Panel>
        <Panel>
          <p className="eyebrow">Contact support</p>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-surface" maxLength={120} />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="How can we help?" className="min-h-32 bg-surface" maxLength={2000} />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit">Send request</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
