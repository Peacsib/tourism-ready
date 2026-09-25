import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";
import { ReadinessLoop } from "@/components/tw/readiness-loop";
import { useEffect, useState } from "react";
import {
  Bell, BookOpen, Bot, Briefcase, CalendarDays, CircleHelp, Compass, IdCard, LayoutGrid, LogOut, MapPin, Menu, Network, PanelLeft, PanelLeftClose, Radar, RotateCcw, Search, UserRound, Workflow, MessagesSquare } from "lucide-react";
import { Avatar, Logo } from "@/components/tw/motifs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/tw/command-palette";
import { ROLES, type RoleId } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { acceptConnection, displayName, fetchNotifications, markAllNotificationsRead, markNotificationRead, removeConnection, timeAgo, type AppNotification } from "@/lib/social";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Platform — Tourism Workforce 2031" },
      { name: "description", content: "Your workforce readiness platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

export const NAV = [
  { to: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/app/tutor", label: "AI Tutor", icon: Bot, ws: "tutor" },
  { to: "/app/simulations", label: "Simulations", icon: Workflow, assist: "simulations" },
  { to: "/app/passport", label: "Skills Passport", icon: IdCard, assist: "passport" },
  { to: "/app/intelligence", label: "Industry Intelligence", icon: Radar, assist: "intelligence" },
  { to: "/app/network", label: "Network", icon: Network, assist: "network" },
  { to: "/app/messages", label: "Messages", icon: MessagesSquare },
  { to: "/app/opportunities", label: "Opportunities", icon: Briefcase, assist: "opportunities" },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/learning", label: "Learning", icon: BookOpen, assist: "learning" },
  { to: "/app/hubs", label: "Field & Innovation Hubs", icon: MapPin, assist: "hubs" },
  { to: "/app/profile", label: "Profile", icon: UserRound },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { persona } = useApp();
  const loc = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate}><Logo /></Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        {NAV.map((n) => {
          const ws = "ws" in n ? n.ws : null;
          const assist = "assist" in n ? n.assist : null;
          const active = "exact" in n ? loc.pathname === n.to || loc.pathname === n.to + "/" : loc.pathname.startsWith(n.to) || (!!(ws ?? assist) && loc.pathname.startsWith(`/app/ws/${ws ?? assist}`));
          const linkProps = ws ? ({ to: "/app/ws/$module", params: { module: ws } } as const) : ({ to: n.to } as const);
          return (
            <Link
              key={n.to}
              {...linkProps}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {active && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold" />}
              <n.icon className={cn("h-4 w-4 transition-colors", active ? "text-gold" : "group-hover:text-foreground")} strokeWidth={1.6} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        <Link to="/app/help" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground">
          <CircleHelp className="h-4 w-4" strokeWidth={1.6} /> Help & Support
        </Link>
        <Link to="/app/profile" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent/60">
          <Avatar initials={persona.initials} size="sm" tone="gold" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{persona.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{persona.organisation}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function Notifications() {
  const { notifications, markAllRead, markRead } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [real, setReal] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const load = () => fetchNotifications().then(setReal).catch(() => {});
    void load();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);
  const reload = () => fetchNotifications().then(setReal).catch(() => {});
  const unread = notifications.filter((n) => !n.read).length + real.filter((n) => !n.read_at).length;
  const openProfile = async (n: AppNotification) => {
    await markNotificationRead(n.id); void reload();
    if (n.actor) navigate({ to: "/app/people/$id", params: { id: n.actor.id } });
  };
  const act = async (n: AppNotification, accept: boolean) => {
    if (!n.connection_id) return;
    setBusy(n.id);
    try {
      if (accept) { await acceptConnection(n.connection_id); toast.success(`You're now connected with ${displayName(n.actor)}`); }
      else { await removeConnection(n.connection_id); toast("Request ignored"); }
      await markNotificationRead(n.id); await reload();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
          <button onClick={async () => { markAllRead(); if (user) { await markAllNotificationsRead(user.id); void reload(); } }} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40" disabled={!unread}>Mark all read</button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && real.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</li>}
          {real.map((n) => {
            const name = displayName(n.actor);
            const pending = n.kind === "connection_request" && n.connection_status === "pending";
            return (
              <li key={n.id} className="flex gap-3 border-b px-4 py-3">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-gold")} />
                <div className="flex-1">
                  <button onClick={() => openProfile(n)} className="text-left text-sm hover:underline">
                    <strong>{name}</strong> {n.kind === "connection_request" ? "wants to connect with you." : "accepted your connection request."}
                  </button>
                  {n.body && n.kind === "connection_request" && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">“{n.body}”</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openProfile(n)}>View profile</Button>
                    {pending && <Button size="sm" disabled={busy === n.id} onClick={() => act(n, true)}>Accept</Button>}
                    {pending && <Button size="sm" variant="outline" disabled={busy === n.id} onClick={() => act(n, false)}>Ignore</Button>}
                    {n.kind === "connection_request" && n.connection_status === "accepted" && <span className="self-center text-xs text-muted-foreground">Connected</span>}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </li>
            );
          })}
          {notifications.slice(0, 12).map((n) => (
            <li key={n.id}>
              <button
                onClick={() => { markRead(n.id); navigate({ to: n.to }); }}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-accent"
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-gold")} />
                <span className="flex-1 text-sm">{n.text}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{n.time}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const ASSIST: { prefix: string; module: string; agent: string; prompt: string }[] = [
  { prefix: "/app/simulations", module: "simulations", agent: "Nyanzvi Sim", prompt: "Explain my performance or rehearse a scenario" },
  { prefix: "/app/passport", module: "passport", agent: "Nyanzvi Passport", prompt: "How can I improve this skill?" },
  { prefix: "/app/intelligence", module: "intelligence", agent: "Nyanzvi Insight", prompt: "What does this mean for my career?" },
  { prefix: "/app/network", module: "network", agent: "Nyanzvi Connect", prompt: "Who should I connect with?" },
  { prefix: "/app/my-network", module: "network", agent: "Nyanzvi Connect", prompt: "Who should I connect with?" },
  { prefix: "/app/opportunities", module: "opportunities", agent: "Nyanzvi Careers", prompt: "Prepare for an application" },
  { prefix: "/app/events", module: "intelligence", agent: "Nyanzvi Insight", prompt: "Which events are relevant to me?" },
  { prefix: "/app/learning", module: "learning", agent: "Nyanzvi Learn", prompt: "Need help with this topic?" },
  { prefix: "/app/hubs", module: "hubs", agent: "Nyanzvi Field", prompt: "Which programme suits me?" },
];

function AssistBar({ pathname }: { pathname: string }) {
  const a = ASSIST.find((x) => pathname.startsWith(x.prefix));
  if (!a) return null;
  return (
    <Link to="/app/ws/$module" params={{ module: a.module }} className="group mb-6 flex items-center gap-3 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-2.5 text-sm transition-colors hover:bg-cyan/10">
      <img src={nyanzviLogo} alt="" className="h-6 w-6" />
      <span className="min-w-0 flex-1 truncate"><span className="font-medium">{a.prompt}</span> <span className="text-muted-foreground">· Ask {a.agent}</span></span>
      <span className="text-xs font-medium text-cyan group-hover:translate-x-0.5 transition-transform">Open →</span>
    </Link>
  );
}

function AppLayout() {
  const { hydrated, personaId, persona, setRole, signOut, resetDemo } = useApp();
  const { loading: authLoading, user, profile } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const isFocusView = loc.pathname.startsWith("/app/simulations") || loc.pathname.startsWith("/app/tutor") || loc.pathname.startsWith("/app/ws");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isFocusView);

  // Automatically close sidebar when entering a simulation, AI tutor, or workspace for full view
  useEffect(() => {
    if (isFocusView) {
      setSidebarCollapsed(true);
    }
  }, [loc.pathname, isFocusView]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/auth" });
    else if (hydrated && !personaId) navigate({ to: "/start" });
  }, [authLoading, user, hydrated, personaId, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (authLoading || !user || !hydrated || !personaId) {
    return <div className="flex min-h-screen items-center justify-center"><Logo className="animate-pulse" /></div>;
  }

  const roleLabel = ROLES.find((r) => r.id === persona.role)?.label ?? "";

  return (
    <div className={cn("min-h-screen transition-all duration-300", sidebarCollapsed ? "flex flex-col" : "lg:grid lg:grid-cols-[256px_1fr]")}>
      {!sidebarCollapsed && (
        <aside className="sticky top-0 hidden h-screen border-r glass lg:block">
          <SidebarContent />
        </aside>
      )}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r bg-background p-0 shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan/10 to-transparent" />
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b glass px-4 md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex text-muted-foreground hover:text-foreground"
            title={sidebarCollapsed ? "Open sidebar" : "Collapse sidebar (Full view)"}
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          <button
            onClick={() => setCmdOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 md:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search people, skills, simulations…</span>
            <kbd className="ml-auto hidden rounded border px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
                  <Compass className="h-3.5 w-3.5 text-cyan" /> {roleLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>View dashboard as</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={persona.role} onValueChange={(v) => setRole(v as RoleId)}>
                  {ROLES.map((r) => <DropdownMenuRadioItem key={r.id} value={r.id}>{r.label}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full" aria-label="Account menu"><Avatar initials={persona.initials} size="sm" tone="gold" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{persona.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{profile?.email ?? persona.title}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/app/profile" })}><UserRound className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/start" })}><Compass className="mr-2 h-4 w-4" /> Change my role</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { resetDemo(); navigate({ to: "/start" }); }}><RotateCcw className="mr-2 h-4 w-4" /> Reset demo data</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { signOut(); navigate({ to: "/" }); }}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main key={loc.pathname} className={cn(
          "fade-up mx-auto w-full px-4 py-6 md:px-8 md:py-8",
          isFocusView ? "max-w-none px-2 sm:px-4 md:px-6 py-2" : "max-w-7xl"
        )}>
          {!loc.pathname.startsWith("/app/network") && !loc.pathname.startsWith("/app/simulations") && (
            <AssistBar pathname={loc.pathname} />
          )}
          <Outlet />
          {!loc.pathname.startsWith("/app/ws/") && !loc.pathname.startsWith("/app/simulations/") && <ReadinessLoop pathname={loc.pathname} />}
        </main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
