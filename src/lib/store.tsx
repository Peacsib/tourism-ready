import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COMPETENCIES, PERSONAS, POSTS, TIMELINE_SEED, type Competency, type Persona, type Post, type RoleId } from "./data";

export type Notification = { id: string; text: string; time: string; read: boolean; to: string };
export type TimelineEntry = { id: string; type: string; title: string; detail: string; date: string; fresh?: boolean };
export type SimAttempt = {
  id: string;
  simId: string;
  title: string;
  scores: { label: string; value: number }[];
  competencies: string[];
  addedToPassport: boolean;
  date: string;
};

type State = {
  personaId: string | null;
  role: RoleId | null;
  competencies: Competency[];
  timeline: TimelineEntry[];
  attempts: SimAttempt[];
  connections: string[];
  pending: string[];
  posts: Post[];
  reacted: string[];
  savedPosts: string[];
  savedOpps: string[];
  applied: string[];
  courseProgress: Record<string, number>;
  hubRegistrations: string[];
  notifications: Notification[];
};

const initialNotifications: Notification[] = [
  { id: "n1", text: "Your AI Tutor recommends a new simulation: Hotel Reservation Desk.", time: "10m", read: false, to: "/app/simulations/reservation-desk" },
  { id: "n2", text: "Farai Mutasa accepted your connection.", time: "2h", read: false, to: "/app/network" },
  { id: "n3", text: "New Industry Intelligence: AI adoption in hospitality.", time: "1d", read: false, to: "/app/intelligence" },
  { id: "n4", text: "Your learning pathway is ready: Front Office Readiness.", time: "2d", read: true, to: "/app/learning" },
];

const initial: State = {
  personaId: null,
  role: null,
  competencies: COMPETENCIES,
  timeline: TIMELINE_SEED,
  attempts: [],
  connections: ["p1", "p4"],
  pending: [],
  posts: POSTS,
  reacted: [],
  savedPosts: [],
  savedOpps: [],
  applied: [],
  courseProgress: {},
  hubRegistrations: [],
  notifications: initialNotifications,
};

const KEY = "tw2031-state-v1";

type Ctx = State & {
  hydrated: boolean;
  persona: Persona;
  enter: (personaId: string, role?: RoleId) => void;
  setRole: (role: RoleId) => void;
  signOut: () => void;
  resetDemo: () => void;
  recordAttempt: (a: Omit<SimAttempt, "id" | "date" | "addedToPassport">) => string;
  addAttemptToPassport: (attemptId: string) => void;
  connect: (id: string) => void;
  toggleReact: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addPost: (body: string) => void;
  toggleSaveOpp: (id: string) => void;
  apply: (id: string) => void;
  advanceCourse: (id: string, base: number) => void;
  registerHub: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  notify: (text: string, to: string) => void;
};

const AppContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 9);
const levelToState = (n: number): Competency["state"] =>
  n >= 80 ? "Verified" : n >= 65 ? "Demonstrated" : n >= 50 ? "Practising" : "Developing";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {
      /* corrupted storage: start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const persona = useMemo(() => {
    const p = PERSONAS.find((x) => x.id === state.personaId) ?? PERSONAS[0]!;
    return state.role ? { ...p, role: state.role } : p;
  }, [state.personaId, state.role]);

  const notify = useCallback((text: string, to: string) => {
    setState((s) => ({ ...s, notifications: [{ id: uid(), text, time: "now", read: false, to }, ...s.notifications] }));
  }, []);

  const value: Ctx = {
    ...state,
    hydrated,
    persona,
    notify,
    enter: (personaId, role) =>
      setState((s) => ({ ...s, personaId, role: role ?? PERSONAS.find((p) => p.id === personaId)?.role ?? "student" })),
    setRole: (role) => setState((s) => ({ ...s, role })),
    signOut: () => setState((s) => ({ ...s, personaId: null, role: null })),
    resetDemo: () => setState({ ...initial }),
    recordAttempt: (a) => {
      const id = uid();
      setState((s) => ({
        ...s,
        attempts: [{ ...a, id, addedToPassport: false, date: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }) }, ...s.attempts],
      }));
      return id;
    },
    addAttemptToPassport: (attemptId) =>
      setState((s) => {
        const att = s.attempts.find((x) => x.id === attemptId);
        if (!att || att.addedToPassport) return s;
        const avg = Math.round(att.scores.reduce((t, x) => t + x.value, 0) / att.scores.length);
        const boost = Math.max(4, Math.round(avg / 8));
        const competencies = s.competencies.map((c) => {
          if (!att.competencies.some((n) => c.name.toLowerCase().includes(n.toLowerCase().split(" ")[0] ?? ""))) return c;
          const level = Math.min(100, c.level + boost);
          return { ...c, level, state: levelToState(level) };
        });
        return {
          ...s,
          competencies,
          attempts: s.attempts.map((x) => (x.id === attemptId ? { ...x, addedToPassport: true } : x)),
          timeline: [
            { id: uid(), type: "Simulation", title: att.title, detail: `${avg >= 75 ? "Demonstrated" : "Practised"} · ${att.competencies.join(", ")}`, date: att.date, fresh: true },
            ...s.timeline.map((t) => ({ ...t, fresh: false })),
          ],
          notifications: [{ id: uid(), text: `Your Skills Passport has been updated with ${att.title}.`, time: "now", read: false, to: "/app/passport" }, ...s.notifications],
        };
      }),
    connect: (id) =>
      setState((s) => (s.connections.includes(id) || s.pending.includes(id) ? s : { ...s, pending: [...s.pending, id] })),
    toggleReact: (postId) =>
      setState((s) => {
        const on = s.reacted.includes(postId);
        return {
          ...s,
          reacted: on ? s.reacted.filter((x) => x !== postId) : [...s.reacted, postId],
          posts: s.posts.map((p) => (p.id === postId ? { ...p, reactions: p.reactions + (on ? -1 : 1) } : p)),
        };
      }),
    toggleSavePost: (postId) =>
      setState((s) => ({ ...s, savedPosts: s.savedPosts.includes(postId) ? s.savedPosts.filter((x) => x !== postId) : [...s.savedPosts, postId] })),
    addComment: (postId, text) =>
      setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { author: persona.name, text }] } : p)) })),
    addPost: (body) =>
      setState((s) => ({ ...s, posts: [{ id: uid(), authorId: "me", label: "Update", time: "now", body, reactions: 0, comments: [] }, ...s.posts] })),
    toggleSaveOpp: (id) =>
      setState((s) => ({ ...s, savedOpps: s.savedOpps.includes(id) ? s.savedOpps.filter((x) => x !== id) : [...s.savedOpps, id] })),
    apply: (id) => setState((s) => (s.applied.includes(id) ? s : { ...s, applied: [...s.applied, id] })),
    advanceCourse: (id, base) =>
      setState((s) => {
        const cur = s.courseProgress[id] ?? base;
        return { ...s, courseProgress: { ...s.courseProgress, [id]: Math.min(100, cur + (cur === 0 ? 17 : 16)) } };
      }),
    registerHub: (id) => setState((s) => (s.hubRegistrations.includes(id) ? s : { ...s, hubRegistrations: [...s.hubRegistrations, id] })),
    markAllRead: () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    markRead: (id) => setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
