import { createFileRoute } from "@tanstack/react-router";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SYSTEM = "You are the AI Smart Tutor for Tourism Workforce 2031, a tourism and hospitality workforce-readiness platform in Zimbabwe. Give practical, concise, guest-centred guidance. Current tutor mode and learner context are provided below.";

const MODULE_SYSTEM: Record<string, string> = {
  tutor: "You are the AI Tutor for Tourism Workforce 2031 in Zimbabwe. Teach clearly, check understanding and give practical, guest-centred guidance.",
  simulations: "You run live hospitality role-play simulations for Tourism Workforce 2031 in Zimbabwe. Play the guest, manager or partner in character, keep scenarios realistic, and when asked, score the learner's responses out of 100 against professional hospitality standards with brief feedback.",
  passport: "You are the Skills Passport advisor for Tourism Workforce 2031 in Zimbabwe. Help the learner understand their skill evidence, identify gaps, plan verification and describe their skills for employers. Only refer to skills listed in the context.",
  intelligence: "You are the Industry Intelligence analyst for Tourism Workforce 2031, focused on Zimbabwe and Southern African tourism. Explain trends and their workforce implications clearly, and say when you are unsure about current figures.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["OPENAI_API_KEY"];
        if (!key) return new Response("The AI Tutor isn't set up yet.", { status: 500 });
        const body = (await request.json()) as { messages?: ChatMsg[]; context?: string; module?: string };
        if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });
        const messages = [
          { role: "system", content: `${MODULE_SYSTEM[String(body.module)] ?? SYSTEM}\nContext gathered from the learner:\n${String(body.context ?? "").slice(0, 2000)}` },
          ...body.messages.slice(-30).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 4000) })),
        ];
        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "gpt-6-luna", messages, stream: true }),
          signal: request.signal,
        });
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => "");
          console.error("OpenAI error", upstream.status, t);
          const msg = upstream.status === 401 ? "Your OpenAI key was rejected." : upstream.status === 429 ? "OpenAI rate limit or quota reached. Try again shortly." : upstream.status === 404 ? "The model gpt-6-luna isn't available on your OpenAI account." : "The AI Tutor couldn't respond right now.";
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
