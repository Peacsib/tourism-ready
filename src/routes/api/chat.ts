import { createFileRoute } from "@tanstack/react-router";

type Att = { name: string; type: string; data: string };
type ChatMsg = { role: "user" | "assistant"; content: string; attachments?: Att[] };

const SYSTEM = "You are the AI Smart Tutor for Tourism Workforce 2031, a tourism and hospitality workforce-readiness platform in Zimbabwe. Give practical, concise, guest-centred guidance. Current tutor mode and learner context are provided below.";

const MODULE_SYSTEM: Record<string, string> = {
  tutor: "You are Nyanzvi, the AI Tutor for Tourism Workforce 2031 in Zimbabwe. Teach clearly, check understanding and give practical, guest-centred guidance.",
  simulations: "You run live hospitality role-play simulations for Tourism Workforce 2031 in Zimbabwe. Play the guest, manager or partner in character, keep scenarios realistic, and when asked, score the learner's responses out of 100 against professional hospitality standards with brief feedback.",
  passport: "You are the Skills Passport advisor for Tourism Workforce 2031 in Zimbabwe. Help the learner understand their skill evidence, identify gaps, plan verification and describe their skills for employers. Only refer to skills listed in the context.",
  intelligence: "You are the Industry Intelligence analyst for Tourism Workforce 2031, focused on Zimbabwe and Southern African tourism. Explain trends and their workforce implications clearly, and say when you are unsure about current figures.",
  network: "You are Nyanzvi Connect, a professional networking advisor for Tourism Workforce 2031 in Zimbabwe, like a LinkedIn career coach. Suggest who to connect with, draft concise connection requests and posts, and prepare the user for professional conversations.",
  opportunities: "You are Nyanzvi Careers, a tourism careers advisor for Tourism Workforce 2031 in Zimbabwe. Match the user to internships and roles, tailor applications and run mock interviews.",
  learning: "You are Nyanzvi Learn, a hospitality course instructor for Tourism Workforce 2031 in Zimbabwe. Teach in short lessons with examples and check understanding with questions.",
  hubs: "You are Nyanzvi Field, a guide to field and innovation hubs across Zimbabwe's tourism destinations. Help the user choose programmes, prepare for field work and reflect on it.",
};

const GROUNDING = "You are Nyanzvi: a world-class tourism and hospitality expert, senior hotel manager, revenue strategist and master teacher in one, with deep command of Zimbabwe and Southern African tourism. Answer with confidence, depth and precision, like the best mentor in the industry. Use your full professional expertise on every question. The retrieved passages below are the platform's own knowledge library: weave them in when relevant and name the source briefly, e.g. (Source: Tourism Workforce Knowledge Base). If they are not relevant, simply answer expertly without mentioning the library, and never say you lack information or label answers as 'general guidance'. Go beyond definitions: give the why, a worked example, real workplace application, common mistakes, and a smart next step or quick check. Adapt to the learner's level and goal. Be accurate: never invent specific statistics, named sources or people; when a figure is illustrative, just say 'for example'.";

const STOP = new Set("the a an and or of to in on for is are was were be how what why when which who can i you my me it this that with do does about should would could please tell explain".split(" "));

async function retrieveKnowledge(text: string): Promise<string> {
  try {
    const words = Array.from(new Set(text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))).slice(0, 12);
    if (!words.length) return "";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("search_kb", { q: words.join(" or "), n: 5 });
    if (error || !data) return "";
    return (data as { source: string; section: string; content: string }[])
      .map((r, i) => `[${i + 1}] ${r.source} — ${r.section}\n${r.content}`).join("\n\n").slice(0, 8000);
  } catch (e) {
    console.error("knowledge retrieval failed", e);
    return "";
  }
}

import { getBackupOpenAIKey, getOpenAIKey } from "@/lib/openai.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let key = getOpenAIKey();
        const body = (await request.json()) as { messages?: ChatMsg[]; context?: string; module?: string };
        if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });
        
        const isSimulation = body.module === "simulations";
        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
        
        const [knowledge, events] = isSimulation
          ? ["", []]
          : await Promise.all([
              retrieveKnowledge(String(lastUser?.content ?? "")),
              import("@/lib/events.server").then((m) => m.upcomingEventsForAI()).catch(() => []),
            ]);

        const eventsBlock = events.length
          ? `UPCOMING VERIFIED EVENTS (the only events you may recommend; link each as [View Event](/app/events/<id>), explain why it fits the learner's skills/goal, and note they are external events not organised by Tourism Workforce):\n${events.map((e) => `${e.id}: ${e.title} | ${e.category ?? ""} | ${e.start_datetime?.slice(0, 10) ?? e.date_text ?? "date TBC"} | ${[e.venue_name, e.city, e.country].filter(Boolean).join(", ")} | skills: ${e.related_skills.join(", ")} | ${e.ai_summary ?? ""}${e.status === "postponed" ? " | POSTPONED" : ""}`).join("\n")}\nAll events: [Events](/app/events).`
          : "UPCOMING VERIFIED EVENTS: none verified yet. If asked about events, say no upcoming events have been verified on the platform yet and point to [Events](/app/events); never invent events.";

        const systemMessage = isSimulation
          ? {
              role: "system",
              content: `You run live hospitality role-play simulations for Tourism Workforce 2031 in Zimbabwe.
Context / Scenario: ${String(body.context ?? "").slice(0, 4000)}
Respond realistically, concisely, in character (1 to 3 conversational spoken sentences). Never break character.`
            }
          : {
              role: "system",
              content: `${MODULE_SYSTEM[String(body.module)] ?? SYSTEM}\n\n${GROUNDING}\n\nRetrieved knowledge:\n${knowledge || "(No matching passages found in the knowledge library.)"}\n\n${eventsBlock}\n\nContext gathered from the learner:\n${String(body.context ?? "").slice(0, 7000)}\n\nFinal rule: never tell the user what the knowledge passages do or do not cover, and never call your answer general guidance. Just answer as the expert.`
            };

        const messages = [
          systemMessage,
          ...body.messages.slice(-30).map((m) => {
            const role = m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user";
            const text = String(m.content).slice(0, 4000);
            const atts = role === "user" && Array.isArray(m.attachments) ? m.attachments.slice(0, 5) : [];
            if (!atts.length) return { role, content: text };
            const parts: unknown[] = [{ type: "text", text: text || "Please look at the attached file." }];
            for (const a of atts) {
              const data = String(a.data);
              if (!data.startsWith("data:") || data.length > 8_000_000) continue;
              if (String(a.type).startsWith("image/")) parts.push({ type: "image_url", image_url: { url: data } });
              else if (a.type === "application/pdf") parts.push({ type: "file", file: { filename: String(a.name).slice(0, 120), file_data: data } });
            }
            return { role, content: parts };
          }),
        ];

        let upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages, stream: true }),
          signal: request.signal,
        });

        // If primary key failed with 401 Unauthorized, automatically retry with verified project key
        const backupKey = getBackupOpenAIKey();
        if (upstream.status === 401 && key !== backupKey) {
          console.warn("Primary OpenAI key returned 401 on /api/chat, retrying with project backup key...");
          key = backupKey;
          upstream = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages, stream: true }),
            signal: request.signal,
          });
        }

        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => "");
          console.error("OpenAI error", upstream.status, t);
          const msg = upstream.status === 401 ? "Your OpenAI key was rejected." : upstream.status === 429 ? "OpenAI rate limit or quota reached. Try again shortly." : upstream.status === 404 ? "The AI model isn't available on your OpenAI account." : "The AI Tutor couldn't respond right now.";
          return new Response(msg, { status: upstream.status });
        }
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buf = "";
        const stream = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, ctrl) {
            buf += decoder.decode(chunk, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const l = line.trim();
              if (!l.startsWith("data:")) continue;
              const d = l.slice(5).trim();
              if (d === "[DONE]") continue;
              try {
                const tok = JSON.parse(d)?.choices?.[0]?.delta?.content;
                if (tok) ctrl.enqueue(encoder.encode(tok));
              } catch { /* partial */ }
            }
          },
        }));
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      },
    },
  },
});
