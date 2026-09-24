import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Person } from "@/lib/data";
import { toast } from "sonner";

export function MessageDialog({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const send = () => {
    if (text.trim().length < 5) { setErr("Write at least a short introduction (5+ characters)."); return; }
    toast.success(`Message sent to ${person?.name}`);
    setText(""); setErr(""); onClose();
  };
  return (
    <Dialog open={!!person} onOpenChange={(o) => { if (!o) { setErr(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {person?.name}</DialogTitle>
          <DialogDescription>{person?.role} · {person?.organisation}</DialogDescription>
        </DialogHeader>
        <Textarea value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} placeholder="Introduce yourself and why you'd like to connect…" className="min-h-32 bg-surface" maxLength={1000} aria-invalid={!!err} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={send}>Send message</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
