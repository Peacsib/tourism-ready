import type { CardKind, WorkspaceId } from "./workspaces";

export type WsMessage = { id: string; role: "user" | "assistant"; content: string; card?: CardKind };
export type WsThread = { id: string; module: WorkspaceId; title: string; focus: string; mode?: string; updatedAt: number; messages: WsMessage[] };

const key = (uid: string) => `tw2031-ws-threads-${uid}`;

export function loadThreads(uid: string): WsThread[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key(uid)) ?? "[]") as WsThread[]; } catch { return []; }
}

export function saveThreads(uid: string, threads: WsThread[]) {
  localStorage.setItem(key(uid), JSON.stringify(threads.slice(0, 200)));
}

export function upsertThread(uid: string, t: WsThread) {
  const all = loadThreads(uid).filter((x) => x.id !== t.id);
  saveThreads(uid, [t, ...all]);
}

export function deleteThread(uid: string, id: string) {
  saveThreads(uid, loadThreads(uid).filter((x) => x.id !== id));
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
