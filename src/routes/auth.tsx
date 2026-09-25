import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/tw/motifs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: "Sign in — Tourism Workforce 2031" },
      { name: "description", content: "Create your account to build a verified Skills Passport for Zimbabwe's tourism and hospitality workforce." },
      { property: "og:title", content: "Sign in to Tourism Workforce 2031" },
      { property: "og:description", content: "One account for your Skills Passport, simulations and industry network." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/start" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/start`,
        },
      });
      if (error) {
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (result?.error) throw result.error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>

        <div className="fade-up my-auto rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur md:p-8">
          {sent ? (
            <div className="text-center">
              <Mail className="mx-auto h-8 w-8 text-cyan" strokeWidth={1.5} />
              <h1 className="mt-4 text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to activate your account, then sign in.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => { setSent(false); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <p className="eyebrow text-cyan">{mode === "signin" ? "Welcome back" : "Create your account"}</p>
              <h1 className="mt-2 text-2xl font-semibold">
                {mode === "signin" ? "Sign in to your passport" : "Start your Skills Passport"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your skills, simulations and progress stay with you on any device.
              </p>

              <Button variant="outline" className="mt-6 h-11 w-full gap-2" onClick={google} disabled={busy}>
                <GoogleMark /> Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Moyo" required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                <Button type="submit" className="h-11 w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New here? " : "Already have an account? "}
                <button
                  type="button"
                  className={cn("font-medium text-foreground underline underline-offset-4")}
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1-.8 2.6-2.3 3.6l3.5 2.7c2.1-1.9 3.3-4.8 3.3-8.2z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.6-2.8c-1 .7-2.3 1.2-4 1.2-3.1 0-5.7-2-6.6-4.8l-4.2 3.2C3.1 21.3 7.2 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.8a7.4 7.4 0 0 1 0-5.6L1.2 6C.4 7.8 0 9.8 0 12s.4 4.2 1.2 6l4.2-3.2z" />
      <path fill="#EA4335" d="M12 4.8c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.7 1.2 15.1 0 12 0 7.2 0 3.1 2.7 1.2 6l4.2 3.2C6.3 6.4 8.9 4.8 12 4.8z" />
    </svg>
  );
}
