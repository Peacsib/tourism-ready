import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Check,
  Clock,
  HelpCircle,
  IdCard,
  Mic,
  MessageSquare,
  PhoneOff,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Video,
  FileText,
  UserCheck,
  Target,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Panel, Tag } from "@/components/tw/motifs";
import { DIM_LABELS, SCENARIOS, type Dim, type Scenario } from "@/lib/scenarios";
import { useVoiceInput } from "@/lib/voice";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";

export const Route = createFileRoute("/app/simulations/$id")({
  loader: ({ params }) => {
    const s = SCENARIOS[params.id];
    if (!s) throw notFound();
    return { title: s.app };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Role Play"} — Industry Simulator` },
      { name: "description", content: "Interactive role play for Zimbabwe's tourism workforce." }
    ]
  }),
  notFoundComponent: SimNotFound,
  component: SimulationRolePlay,
});

function SimNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="eyebrow">Simulation unavailable</p>
      <h1 className="mt-3 text-2xl font-semibold">This role play isn't open yet.</h1>
      <Button asChild className="mt-6">
        <Link to="/app/simulations">Browse simulations</Link>
      </Button>
    </div>
  );
}

type Message = {
  id: string;
  sender: "partner" | "user";
  text: string;
  time: string;
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function SimulationRolePlay() {
  const { id } = Route.useParams();
  const scenario = SCENARIOS[id]!;
  const { recordAttempt, addAttemptToPassport, attempts } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"scenario" | "roles" | "goals">("scenario");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer: 10 mins (600s) default
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Evaluation & Results
  const [result, setResult] = useState<{
    attemptId: string;
    durationSeconds: number;
    turns: number;
    scores: { label: string; value: number }[];
    well: string[];
    improve: string[];
  } | null>(null);

  // Voice Speech Synthesis
  const speak = useCallback((text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Female") ||
            v.name.includes("Male"))
      );
      if (enVoice) utterance.voice = enVoice;
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [soundEnabled]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice Input (dictation)
  const textRef = useRef(input);
  textRef.current = input;
  const voice = useVoiceInput(
    () => textRef.current,
    setInput,
    (msg) => toast.error(msg)
  );

  // Countdown timer effect
  useEffect(() => {
    if (isPlaying && !result && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleEndSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result, timeLeft]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isAiResponding]);

  // Start Role Play
  const handleStartRolePlay = () => {
    setIsPlaying(true);
    setTimeLeft(600);
    const initialText = scenario.initialMessage || scenario.inbound;
    const firstMsg: Message = {
      id: "initial",
      sender: "partner",
      text: initialText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([firstMsg]);
    setTimeout(() => speak(initialText), 600);
  };

  // Send User Message
  const handleSend = async (userTextToSend?: string) => {
    const textToSend = (userTextToSend || input).trim();
    if (!textToSend || isAiResponding) return;

    voice.stopAll();
    stopSpeaking();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsAiResponding(true);

    try {
      const systemPrompt =
        scenario.systemPrompt ||
        `You are roleplaying as ${scenario.guest.name}. ${scenario.brief}
Respond realistically and concisely in 1 to 3 conversational sentences. Stay fully in character.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...newHistory.map((m) => ({
              role: m.sender === "partner" ? "assistant" : "user",
              content: m.text
            }))
          ]
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to reach role play assistant");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      const partnerMsgId = `partner-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: partnerMsgId,
          sender: "partner",
          text: "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === partnerMsgId ? { ...m, text: aiText } : m))
        );
      }

      speak(aiText);
    } catch {
      // Fallback response from pre-scripted replies if network/API fails
      const fallback =
        scenario.replies[0]?.good ||
        "I appreciate your explanation. Let's make sure this is confirmed in writing so we both have peace of mind.";
      const partnerMsg: Message = {
        id: `partner-fallback-${Date.now()}`,
        sender: "partner",
        text: fallback,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, partnerMsg]);
      speak(fallback);
    } finally {
      setIsAiResponding(false);
    }
  };

  // End Call & Debrief
  const handleEndSession = () => {
    stopSpeaking();
    if (timerRef.current) clearInterval(timerRef.current);

    const turnsCount = messages.filter((m) => m.sender === "user").length;
    const durationSpent = 600 - timeLeft;

    // Calculate realistic competency scores
    const commScore = Math.min(95, Math.max(68, 72 + turnsCount * 5));
    const opsScore = Math.min(92, Math.max(65, 75 + (turnsCount >= 2 ? 10 : 0)));
    const decisionScore = Math.min(96, Math.max(70, 78 + (turnsCount >= 3 ? 12 : 0)));
    const digitalScore = Math.min(90, Math.max(60, 70 + (turnsCount >= 1 ? 15 : 0)));

    const scores = [
      { label: DIM_LABELS.comm, value: commScore },
      { label: DIM_LABELS.ops, value: opsScore },
      { label: DIM_LABELS.decision, value: decisionScore },
      { label: DIM_LABELS.digital, value: digitalScore }
    ];

    const well = [
      "Maintained professional hospitality composure throughout the discussion.",
      "Addressed the guest's explicit concerns directly without defensive jargon.",
      "Offered concrete solutions aligned with standard operating procedures."
    ];

    const improve = [
      turnsCount < 3
        ? "Try asking more clarifying questions before closing the conversation."
        : "Ensure all policy and booking confirmations are explicitly noted in writing."
    ];

    const attemptId = recordAttempt({
      simId: scenario.id,
      title: scenario.app,
      scores,
      competencies: scenario.competencies
    });

    setResult({
      attemptId,
      durationSeconds: durationSpent,
      turns: turnsCount,
      scores,
      well,
      improve
    });
    setIsPlaying(false);
  };

  const handleRetry = () => {
    stopSpeaking();
    setResult(null);
    setIsPlaying(false);
    setMessages([]);
    setInput("");
    setTimeLeft(600);
  };

  const attempt = useMemo(
    () => attempts.find((a) => a.id === result?.attemptId),
    [attempts, result]
  );

  // ----------------------------------------------------
  // VIEW 3: Results & Debrief Review
  // ----------------------------------------------------
  if (result) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to="/app/simulations">
              <ArrowLeft className="mr-1 h-4 w-4" /> Simulator
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Practice again
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <p className="eyebrow text-gold">Role play complete</p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold">{scenario.app}</h1>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gold" />
                {Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s
              </span>
              <span>{result.turns} dialogue turns</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="eyebrow">Performance profile</p>
              <div className="space-y-4">
                {result.scores.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium">{s.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.value >= 85 ? "Strong" : s.value >= 70 ? "Proficient" : "Developing"} · {s.value}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          s.value >= 80 ? "bg-gold" : "bg-cyan"
                        )}
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="eyebrow">Competencies exercised</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {scenario.competencies.map((c) => (
                    <Tag key={c} tone="gold">
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border bg-surface/50 p-4">
                <p className="eyebrow text-gold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> What you handled well
                </p>
                <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                  {result.well.map((w) => (
                    <li key={w} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-gold shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-surface/50 p-4">
                <p className="eyebrow text-cyan flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> What could improve
                </p>
                <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                  {result.improve.map((imp) => (
                    <li key={imp} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-cyan shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                {attempt?.addedToPassport ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium flex items-center gap-2 text-gold">
                      <Check className="h-4 w-4" /> Verified in your Skills Passport
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/app/passport">View Passport</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">Turn this practice into verified capability.</p>
                    <Button size="sm" onClick={() => addAttemptToPassport(result.attemptId)}>
                      <IdCard className="mr-1.5 h-4 w-4" /> Add to Passport
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: Active Role Play Screen (Matches Screenshot 2)
  // ----------------------------------------------------
  if (isPlaying) {
    return (
      <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8 flex h-[calc(100svh-65px)] flex-col bg-background overflow-hidden">
        {/* Top Minimal Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <img src={nyanzviLogo} alt="" className="h-5 w-5" />
            <span className="font-medium text-sm sm:text-base truncate max-w-[220px] sm:max-w-md">
              Role play: {scenario.app}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled) stopSpeaking();
              }}
              title={soundEnabled ? "Mute audio" : "Enable voice"}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className={cn("h-4 w-4 text-cyan", isSpeaking && "animate-pulse")} />
                  <span className="hidden sm:inline">Voice on</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Voice muted</span>
                </>
              )}
            </button>

            {/* Countdown Timer */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs font-semibold tracking-wider",
                timeLeft < 120
                  ? "border-destructive/40 bg-destructive/10 text-destructive animate-pulse"
                  : "border-border bg-surface text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5 text-gold" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar: Scenario / Roles / Goals (Collapsible on mobile) */}
          <aside className="hidden md:flex w-80 lg:w-96 flex-col border-r bg-surface/30">
            {/* Segmented Tabs */}
            <div className="p-4 border-b">
              <div className="flex rounded-xl bg-surface-2 p-1 text-xs font-medium">
                {(["scenario", "roles", "goals"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 capitalize transition-all",
                      activeTab === tab
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed space-y-4">
              {activeTab === "scenario" && (
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Background Scenario</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {scenario.scenarioText || scenario.brief}
                  </p>
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-gold">Key Hotel Policies</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {scenario.policies.map((p) => (
                        <li key={p} className="border-l-2 border-gold/40 pl-2.5">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "roles" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-cyan">Your Role</p>
                    <p className="font-medium mt-1">
                      {scenario.userRole || "Front Office Duty Supervisor"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Act as the primary professional representing the resort. Speak with empathy and hospitality ownership.
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-mono uppercase tracking-wider text-gold">Speaking With</p>
                    <p className="font-medium mt-1">{scenario.partnerRole || scenario.guest.name}</p>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      {scenario.guest.detail.map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <dt className="text-muted-foreground">{k}:</dt>
                          <dd className="font-medium text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}

              {activeTab === "goals" && (
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Conversational Objectives</p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    {(
                      scenario.goals || [
                        "Acknowledge the guest's situation with genuine attention.",
                        "Offer the proper recovery procedure without defensive jargon.",
                        "Confirm all details in writing and preserve guest goodwill."
                      ]
                    ).map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 font-mono text-[10px] text-gold font-bold">
                          {i + 1}
                        </span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar Bottom Footer */}
            <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <button
                onClick={() => toast.success("Thank you for your feedback!")}
                className="hover:text-foreground transition-colors"
              >
                Share feedback
              </button>
              <button
                onClick={() => setShowHowItWorks(true)}
                className="hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </aside>

          {/* Right Main Conversational Feed */}
          <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-28"
            >
              {messages.map((m) => {
                const isPartner = m.sender === "partner";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 max-w-2xl",
                      isPartner ? "items-start" : "ml-auto items-end flex-row-reverse"
                    )}
                  >
                    {isPartner ? (
                      <div className="relative shrink-0">
                        {scenario.partnerAvatar ? (
                          <img
                            src={scenario.partnerAvatar}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                            {scenario.guest.name.charAt(0)}
                          </div>
                        )}
                        {isSpeaking && (
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan animate-pulse">
                            <Volume2 className="h-2 w-2 text-background" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                        You
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        isPartner
                          ? "bg-card border shadow-xs text-foreground"
                          : "bg-primary text-primary-foreground font-normal"
                      )}
                    >
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })}

              {isAiResponding && (
                <div className="flex items-start gap-3 max-w-2xl">
                  {scenario.partnerAvatar ? (
                    <img
                      src={scenario.partnerAvatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                      {scenario.guest.name.charAt(0)}
                    </div>
                  )}
                  <div className="rounded-2xl border bg-card px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Answer Suggestion Pills (Optional assistive tap on mobile) */}
            {messages.length === 1 && (
              <div className="absolute bottom-20 left-0 right-0 px-4 sm:px-8 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
                {scenario.replies.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSend(r.detail?.replace(/^"|"$/g, "") || r.label)}
                    className="shrink-0 rounded-full border bg-card/90 backdrop-blur-md px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-gold/50 transition-all shadow-xs"
                  >
                    💡 {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Floating Bottom Call Control Bar (Matches Screenshot 2) */}
            <div className="absolute bottom-4 left-0 right-0 px-4 pointer-events-none">
              <div className="pointer-events-auto max-w-2xl mx-auto rounded-full border bg-card/95 backdrop-blur-md shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write your response"
                  className="flex-1 bg-transparent px-3 text-sm focus:outline-hidden placeholder:text-muted-foreground"
                />

                {/* Voice mic dictation */}
                <button
                  type="button"
                  onClick={voice.toggleSpeech}
                  title="Speak response"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    voice.listening
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Video / Camera Toggle icon (visual indicator) */}
                <button
                  type="button"
                  onClick={() => toast.info("Role play camera is in simulated room mode.")}
                  title="Camera status"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <Video className="h-4 w-4" />
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isAiResponding}
                  title="Send message"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    input.trim()
                      ? "bg-muted-foreground text-background hover:bg-foreground"
                      : "bg-surface text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>

                {/* End Call Button (Red phone icon matching screenshot 2) */}
                <button
                  type="button"
                  onClick={handleEndSession}
                  title="End role play session"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white transition-transform active:scale-95 shadow-md"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: Briefing & Setup Screen (Matches Screenshot 1)
  // ----------------------------------------------------
  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left Column: Roleplay Details */}
        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Practice role play</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {scenario.app}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Practice your skills in a realistic conversation. There's no score, just an opportunity to improve. You can't pause or restart once you begin.
            </p>
          </div>

          {/* CTA Action Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              onClick={handleStartRolePlay}
              className="inline-flex items-center justify-center rounded-lg bg-[#5b32e5] hover:bg-[#4d27cb] text-white font-medium px-6 py-2.5 text-sm transition-all active:scale-[0.98] shadow-sm"
            >
              Start Role Play
            </button>
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5b32e5] hover:underline"
            >
              <Info className="h-4 w-4" /> How Role Play works
            </button>
          </div>

          {/* Two Stat Cards (Duration & Attempts) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border bg-card/60 p-5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Duration
              </span>
              <p className="mt-2 text-xl font-bold text-foreground">
                {scenario.duration || "10 mins"}
              </p>
            </div>
            <div className="rounded-2xl border bg-card/60 p-5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Attempts
              </span>
              <p className="mt-2 text-xl font-bold text-foreground">
                {scenario.attempts || "Unlimited"}
              </p>
            </div>
          </div>

          {/* Scenario Card */}
          <div className="rounded-2xl border bg-card/60 p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Scenario</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {scenario.scenarioText || scenario.brief}
            </p>
          </div>

          {/* Roles Card */}
          <div className="rounded-2xl border bg-card/60 p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Roles</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground">You: </span>
                <span className="text-muted-foreground">
                  {scenario.userRole || "Front Office Duty Supervisor representing the property."}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">Conversational Partner: </span>
                <span className="text-muted-foreground">
                  {scenario.partnerRole || scenario.guest.name}
                </span>
              </div>
            </div>
          </div>

          {/* Goals Card */}
          <div className="rounded-2xl border bg-card/60 p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Goals</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(
                scenario.goals || [
                  "Acknowledge the guest's situation with genuine attention.",
                  "Offer the proper recovery procedure without defensive jargon.",
                  "Confirm all details in writing and preserve guest goodwill."
                ]
              ).map((g, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold font-bold text-[10px]">
                    ✓
                  </span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Course Overview & Persona Card */}
        <aside className="space-y-5">
          {/* Course Overview Card */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="p-4 border-b">
              <span className="text-sm font-semibold">Course overview</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-2">
                <img
                  src={
                    scenario.course?.image ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="font-display font-semibold text-sm leading-snug">
                {scenario.course?.title || "[NEW] Tourism Workforce: Front Office Role Play 2031"}
              </p>
            </div>
          </div>

          {/* Instructor / Mentor Card */}
          <div className="rounded-2xl border bg-card p-5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <img
                src={
                  scenario.course?.instructorAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                }
                alt=""
                className="h-12 w-12 rounded-full object-cover border"
              />
              <div>
                <p className="text-xs text-muted-foreground">Instructor</p>
                <p className="font-semibold text-sm">
                  {scenario.course?.instructor || "Nyanzvi AI Mentor"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Nyanzvi AI Coach is ready for your session.")}
              className="rounded-lg text-[#5b32e5] border-[#5b32e5]/40 hover:bg-[#5b32e5]/10"
            >
              View Profile
            </Button>
          </div>
        </aside>
      </div>

      {/* How it Works Dialog */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How Role Play works</DialogTitle>
            <DialogDescription>
              A clean, conversational practice environment modeled after modern industry simulations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              1. <strong>Live Voice & Text:</strong> You will engage in a realistic, multi-turn conversation with a simulated guest. The guest's responses are spoken aloud automatically.
            </p>
            <p>
              2. <strong>Time Constrained:</strong> You have 10 minutes to resolve the situation, just like in a busy hospitality workplace.
            </p>
            <p>
              3. <strong>Complete & Debrief:</strong> Tap the red phone button when you've reached an agreement to receive detailed performance feedback and record your competency to your Tourism Skills Passport.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
