import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { RoleId } from "./data";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  headline: string | null;
  organisation: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  goal: string | null;
  role: string;
};

type Ctx = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id">>) => Promise<void>;
  setProfileRole: (role: RoleId) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const PROFILE_COLUMNS = "id, email, full_name, headline, organisation, location, avatar_url, bio, goal, role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (id: string) => {
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id) void loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      user,
      session,
      profile,
      refreshProfile: async () => {
        if (user?.id) await loadProfile(user.id);
      },
      updateProfile: async (patch) => {
        if (!user?.id) return;
        const { data } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id)
          .select(PROFILE_COLUMNS)
          .maybeSingle();
        if (data) setProfile(data as Profile);
      },
      setProfileRole: async (role) => {
        if (!user?.id) return;
        const { data } = await supabase
          .from("profiles")
          .update({ role })
          .eq("id", user.id)
          .select(PROFILE_COLUMNS)
          .maybeSingle();
        if (data) setProfile(data as Profile);
        try {
          const { data: existing } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.id)
            .eq("role", role)
            .maybeSingle();
          if (!existing) {
            await supabase.from("user_roles").insert({ user_id: user.id, role });
          }
        } catch (err) {
          console.warn("user_roles assignment skipped or already exists", err);
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
      },
    }),
    [loading, user, session, profile, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function initialsOf(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TW";
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  return `${(parts[0] ?? "")[0] ?? ""}${(parts[1] ?? "")[0] ?? ""}`.toUpperCase();
}
