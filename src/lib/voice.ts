import { useRef, useState } from "react";

/** Live speech (browser) + recorded voice notes (server transcription). */
export function useVoiceInput(getText: () => string, setText: (t: string) => void, onError: (m: string) => void) {
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recogRef = useRef<{ stop: () => void } | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const join = (a: string, b: string) => (a ? a.replace(/\s*$/, " ") : "") + b;

  const toggleSpeech = () => {
    if (listening) { recogRef.current?.stop(); return; }
    const W = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) { onError("Live speech isn't supported in this browser. Try Chrome or Edge, or record a voice note."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-ZW";
    const base = getText();
    rec.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setText(join(base, t)); };
    rec.onerror = (e: any) => { if (e.error !== "aborted" && e.error !== "no-speech") onError(e.error === "not-allowed" ? "Microphone access was blocked." : "Live speech stopped."); };
    rec.onend = () => { setListening(false); recogRef.current = null; };
    recogRef.current = rec; rec.start(); setListening(true);
  };

  const toggleRecording = async () => {
    if (recording) { recRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false); recRef.current = null;
        const type = (mr.mimeType || "audio/webm").split(";")[0]!.replace("video/", "audio/");
        const blob = new Blob(chunks, { type });
        if (!blob.size) return;
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", new File([blob], `voice.${type.includes("mp4") ? "m4a" : "webm"}`, { type }));
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (!res.ok) throw new Error((await res.text()) || "Couldn't turn that recording into text.");
          const { text } = (await res.json()) as { text: string };
          if (text) setText(join(getText(), text)); else onError("No speech was heard in that recording.");
        } catch (e) { onError((e as Error).message); } finally { setTranscribing(false); }
      };
      recRef.current = mr; mr.start(); setRecording(true);
    } catch { onError("Microphone access was blocked."); }
  };

  const stopAll = () => recogRef.current?.stop();
  return { listening, recording, transcribing, toggleSpeech, toggleRecording, stopAll };
}
