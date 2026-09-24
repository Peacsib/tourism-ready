import { createFileRoute } from "@tanstack/react-router";

const MAX = 14 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Voice notes aren't set up yet.", { status: 500 });
        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File) || !file.size) return new Response("No recording received.", { status: 400 });
        if (file.size > MAX) return new Response("That recording is too long. Keep voice notes under about 10 minutes.", { status: 413 });
        const type = file.type.replace(/^video\//, "audio/").split(";")[0] || "audio/webm";
        const audio = new File([await file.arrayBuffer()], file.name || "voice.webm", { type });
        const up = new FormData();
        up.append("model", "google/gemini-3.5-transcribe");
        up.append("file", audio, audio.name);
        up.append("response_format", "json");
        up.append("stream", "true");
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: up,
          signal: request.signal,
        });
        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          console.error("Transcription error", res.status, t);
          const msg = res.status === 402 ? "AI credits have run out. Top up to keep using voice notes." : res.status === 429 ? "Too many requests. Try again shortly." : "Couldn't turn that recording into text.";
          return new Response(msg, { status: res.status });
        }
        const raw = await res.text();
        let text = "";
        let final = "";
        for (const line of raw.split("\n")) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const d = l.slice(5).trim();
          if (d === "[DONE]") continue;
          try {
            const j = JSON.parse(d);
            if (j.type === "transcript.text.done" && typeof j.text === "string") final = j.text;
            else if (typeof j.delta === "string") text += j.delta;
          } catch { /* skip */ }
        }
        return Response.json({ text: (final || text).trim() });
      },
    },
  },
});
