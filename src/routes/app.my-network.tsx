import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MessageSquare, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/tw/motifs";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { useMyConnections } from "@/components/tw/connect-button";
import { acceptConnection, displayName, removeConnection, ROLE_LABEL, type Conn } from "@/lib/social";

export const Route = createFileRoute("/app/my-network")({
  head: () => ({ meta: [
    { title: "My network — Tourism Workforce 2031" },
    { name: "description", content: "Your connections and invitations on the Tourism Network." },
    { property: "og:title", content: "My network — Tourism Workforce 2031" },
    { property: "og:description", content: "Your connections and invitations on the Tourism Network." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: MyNetwork,
});

function MyNetwork() {
  const net = useMyConnections();
  const [busy, setBusy] = useState<string | null>(null);
  const received = net.conns.filter((c) => c.status === "pending" && c.addressee_id === net.me);
  const sent = net.conns.filter((c) => c.status === "pending" && c.requester_id === net.me);
  const connected = net.conns.filter((c) => c.status === "accepted");

  const act = async (c: Conn, fn: (id: string) => Promise<void>, msg: string) => {
    setBusy(c.id);
    try { await fn(c.id); toast.success(msg); await net.reload(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const Row = ({ c, children }: { c: Conn; children: React.ReactNode }) => (
    <li className="flex items-center gap-3 py-3">
      <Link to="/app/people/$id" params={{ id: c.other?.id ?? "" }}><MemberAvatar m={c.other} /></Link>
      <div className="min-w-0 flex-1">
        <Link to="/app/people/$id" params={{ id: c.other?.id ?? "" }} className="block truncate text-sm font-medium hover:underline">{displayName(c.other)}</Link>
        <p className="truncate text-xs text-muted-foreground">{c.other?.headline || ROLE_LABEL[c.other?.role ?? ""] || "Member"}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Network" title="My network" subtitle="Invitations, requests you've sent and the people you're connected with." actions={<Button asChild variant="outline"><Link to="/app/network">Find people</Link></Button>} />
      {!net.loaded ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="eyebrow">Invitations ({received.length})</p>
            {received.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No pending invitations.</p> : (
              <ul className="divide-y">{received.map((c) => (
                <Row key={c.id} c={c}>
                  <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => act(c, removeConnection, "Invitation ignored")}>Ignore</Button>
                  <Button size="sm" disabled={busy === c.id} onClick={() => act(c, acceptConnection, `Connected with ${displayName(c.other)}`)}>Accept</Button>
                </Row>
              ))}</ul>
            )}
          </section>
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="eyebrow">Connections ({connected.length})</p>
            {connected.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No connections yet. Visit the Network to connect with members.</p> : (
              <ul className="divide-y">{connected.map((c) => (
                <Row key={c.id} c={c}>
                  <Button size="sm" variant="outline" asChild><Link to="/app/messages" search={{ to: c.other?.id }}><MessageSquare className="mr-1 h-3.5 w-3.5" /> Message</Link></Button>
                  <Button size="icon" variant="ghost" aria-label="Remove connection" disabled={busy === c.id} onClick={() => confirm(`Remove ${displayName(c.other)}?`) && act(c, removeConnection, "Connection removed")}><UserMinus className="h-4 w-4" /></Button>
                </Row>
              ))}</ul>
            )}
          </section>
          {sent.length > 0 && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="eyebrow">Sent ({sent.length})</p>
              <ul className="divide-y">{sent.map((c) => (
                <Row key={c.id} c={c}><Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => act(c, removeConnection, "Request withdrawn")}>Withdraw</Button></Row>
              ))}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
