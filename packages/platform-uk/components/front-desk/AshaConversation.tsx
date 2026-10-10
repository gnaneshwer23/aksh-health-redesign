"use client";

import { Mic, MicOff, PhoneCall, PhoneIncoming, Send, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CampaignKind, ConversationSession } from "@/lib/front-desk/types";
import { cn } from "@/lib/utils";

type StartOptions =
  | { direction: "inbound" }
  | { direction: "outbound"; expectedPatientId: string; campaignKind: CampaignKind; campaignId?: string };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const SAMPLE_INBOUND = [
  "I'd like to book my diabetes review",
  "James Patel, 22nd November 1971",
  "My sugars have been 13 to 15 and I've been really thirsty",
  "What time do you open?",
  "I need to cancel my appointment",
];

const STAGE_LABEL: Record<ConversationSession["stage"], string> = {
  greeting: "Greeting",
  identify: "Checking identity",
  intent: "Listening",
  offer_slots: "Offering times",
  confirm_cancel: "Confirming cancellation",
  collect_health: "Recording your update",
  check_in: "Check-in questions",
  closed: "Call ended",
  handed_off: "Passed to the practice team",
};

export function AshaConversation({
  defaultStart = { direction: "inbound" },
  compact = false,
  onActivity,
}: {
  defaultStart?: StartOptions;
  compact?: boolean;
  onActivity?: () => void;
}) {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [token, setToken] = useState<string>("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speak, setSpeak] = useState(!compact);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVoiceSupported(Boolean(getRecognition()));
  }, []);
  useEffect(() => {
    // Scroll only the transcript box, never the page.
    const box = endRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [session?.transcript.length]);

  const sayAloud = useCallback(
    (text: string) => {
      if (!speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ". "));
      u.lang = "en-GB";
      u.rate = 1.02;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang === "en-GB");
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    },
    [speak]
  );

  async function call(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/front-desk/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { reply?: string; session?: ConversationSession; token?: string; error?: string };
      if (!res.ok || !data.session || !data.token) throw new Error(data.error ?? "Asha is unavailable");
      setSession(data.session);
      setToken(data.token);
      if (data.reply) sayAloud(data.reply);
      onActivity?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Asha is unavailable");
    } finally {
      setBusy(false);
    }
  }

  function start(opts: StartOptions = defaultStart) {
    void call({ action: "start", channel: "voice", ...opts });
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || !session || busy) return;
    setInput("");
    void call({ action: "turn", session, token, utterance: t });
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ");
      if (text.trim()) send(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    window.speechSynthesis?.cancel();
    setListening(true);
    rec.start();
  }

  const ended = session?.stage === "closed" || session?.stage === "handed_off";

  return (
    <div className={cn("grid gap-4", !compact && "lg:grid-cols-[1.4fr_1fr]")} data-asha>
      <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[var(--lv-line,#e5e7eb)] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5b5bfb] text-sm font-semibold text-white" aria-hidden>
              A
            </span>
            <div>
              <p className="text-sm font-semibold text-[#0e0d1f]">Asha</p>
              <p className="text-xs text-[#5e5c70]">{session ? STAGE_LABEL[session.stage] : "Automated practice assistant"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSpeak((v) => !v)}
            className="rounded-full p-2 text-[#5e5c70] hover:bg-black/5"
            aria-label={speak ? "Turn spoken replies off" : "Turn spoken replies on"}
            aria-pressed={speak}
          >
            {speak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>

        <div ref={endRef} className="max-h-[28rem] flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Conversation">
          {!session ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="max-w-sm text-sm text-[#5e5c70]">
                Synthetic practice. Try as <strong className="text-[#0e0d1f]">James Patel, 22/11/1971</strong>. Nothing is written to a
                real record and no real phone call is made.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => start({ direction: "inbound" })}
                  className="inline-flex items-center gap-2 rounded-full bg-[#05040a] px-4 py-2.5 text-sm font-medium text-white"
                  disabled={busy}
                >
                  <PhoneIncoming className="h-4 w-4" /> Call the practice
                </button>
                <button
                  type="button"
                  onClick={() => start({ direction: "outbound", expectedPatientId: "P002", campaignKind: "health_check_in" })}
                  className="inline-flex items-center gap-2 rounded-full bg-[#5b5bfb] px-4 py-2.5 text-sm font-medium text-white"
                  disabled={busy}
                >
                  <PhoneCall className="h-4 w-4" /> Asha calls James for a check-in
                </button>
              </div>
            </div>
          ) : (
            session.transcript.map((t, i) => (
              <div key={i} className={cn("flex", t.from === "patient" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    t.from === "patient" ? "bg-[#05040a] text-white" : "bg-[#efeff5] text-[#0e0d1f]"
                  )}
                >
                  {t.text}
                </p>
              </div>
            ))
          )}
        </div>

        {error ? (
          <p role="alert" className="mx-4 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        {session ? (
          <div className="border-t border-black/5 p-3">
            {ended ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#5e5c70]">{STAGE_LABEL[session.stage]}.</p>
                <button type="button" onClick={() => start()} className="rounded-full bg-[#05040a] px-4 py-2 text-sm text-white">
                  New call
                </button>
              </div>
            ) : (
              <>
                {session.direction === "inbound" && session.transcript.length < 3 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {SAMPLE_INBOUND.map((s) => (
                      <button key={s} type="button" onClick={() => send(s)} className="rounded-full bg-[#efeff5] px-3 py-1 text-xs text-[#0e0d1f] hover:bg-[#e4e4f0]">
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  {voiceSupported ? (
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={cn("rounded-full p-2.5", listening ? "bg-red-600 text-white" : "bg-[#efeff5] text-[#0e0d1f]")}
                      aria-label={listening ? "Stop listening" : "Speak to Asha"}
                      aria-pressed={listening}
                    >
                      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  ) : null}
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={listening ? "Listening…" : "Type a reply"}
                    className="h-10 flex-1 rounded-full border border-black/10 bg-[#f7f7fb] px-4 text-sm outline-none focus:border-[#5b5bfb]"
                    aria-label="Your reply"
                    disabled={busy}
                  />
                  <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-[#5b5bfb] p-2.5 text-white disabled:opacity-50" aria-label="Send">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        ) : null}
      </div>

      {!compact ? (
        <aside className="space-y-3 rounded-2xl border border-black/5 bg-[#f7f7fb] p-4 text-sm" aria-label="What Asha has recorded">
          <p className="font-semibold text-[#0e0d1f]">What Asha has recorded</p>
          {session?.captured.length || session?.lastRecorded?.length ? (
            <ul className="space-y-2">
              {!session.captured.length ? <li className="text-xs font-medium text-[#127a45]">Sent to your care team for review</li> : null}
              {(session.captured.length ? session.captured : session.lastRecorded ?? []).map((o, i) => (
                <li key={i} className="rounded-xl bg-white px-3 py-2">
                  <span className="block text-xs text-[#5e5c70]">{o.display}</span>
                  <span className="font-medium text-[#0e0d1f]">{o.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#5e5c70]">Readings, symptoms and medicine updates appear here as you talk.</p>
          )}
          <ul className="space-y-1.5 border-t border-black/5 pt-3 text-xs text-[#5e5c70]">
            <li>• Everything is marked patient-reported and unverified.</li>
            <li>• A GP accepts or rejects it before anything is staged for the record.</li>
            <li>• Asha never gives medical advice. Emergencies get a 999 message and go straight to the team.</li>
            <li>• Synthetic patients only; simulated telephony.</li>
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
