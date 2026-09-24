import { useCallback, useEffect, useState } from "react";
import { Check, Clock, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { acceptConnection, fetchMyConnections, requestConnection, type Conn } from "@/lib/social";

export function useMyConnections() {
  const { user } = useAuth();
  const [conns, setConns] = useState<Conn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    if (!user) return;
    try { setConns(await fetchMyConnections(user.id)); } catch (e) { console.error(e); } finally { setLoaded(true); }
  }, [user]);
  useEffect(() => { reload(); }, [reload]);
  const statusWith = (id: string): "self" | "connected" | "sent" | "received" | "none" => {
    if (id === user?.id) return "self";
    const c = conns.find((x) => x.requester_id === id || x.addressee_id === id);
    if (!c) return "none";
    if (c.status === "accepted") return "connected";
    return c.requester_id === user?.id ? "sent" : "received";
  };
  return { conns, loaded, reload, statusWith, me: user?.id ?? null };
}

export function ConnectButton({ personId, name, net, size = "sm" }: { personId: string; name: string; net: ReturnType<typeof useMyConnections>; size?: "sm" | "default" }) {
  const [busy, setBusy] = useState(false);
  const st = net.statusWith(personId);
  if (st === "self") return null;
  if (st === "connected") return <Button size={size} variant="outline" disabled><Check className="mr-1 h-3.5 w-3.5" /> Connected</Button>;
  if (st === "sent") return <Button size={size} variant="outline" disabled><Clock className="mr-1 h-3.5 w-3.5" /> Pending</Button>;
  const run = async () => {
    if (!net.me) return;
    setBusy(true);
    try {
      if (st === "received") {
        const c = net.conns.find((x) => x.requester_id === personId)!;
        await acceptConnection(c.id); toast.success(`You're now connected with ${name}`);
      } else { await requestConnection(net.me, personId); toast.success(`Connection request sent to ${name}`); }
      await net.reload();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Button size={size} onClick={run} disabled={busy}>
      {st === "received" ? <><UserCheck className="mr-1 h-3.5 w-3.5" /> Accept</> : <><UserPlus className="mr-1 h-3.5 w-3.5" /> Connect</>}
    </Button>
  );
}
