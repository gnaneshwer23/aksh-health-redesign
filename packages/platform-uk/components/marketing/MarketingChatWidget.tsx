"use client";

import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { CHAT_UNAVAILABLE_MESSAGE } from "@/lib/chat/knowledge";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What is human-in-the-loop?",
  "Does this replace EMIS or SystmOne?",
  "How are clinical outputs reviewed?",
  "How do I see a demo?",
] as const;

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

type MarketingChatPanelProps = {
  className?: string;
  onClose?: () => void;
  headingId?: string;
  compact?: boolean;
};

export function MarketingChatPanel({
  className,
  onClose,
  headingId,
  compact = false,
}: MarketingChatPanelProps) {
  const [input, setInput] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [unavailableMessage, setUnavailableMessage] = useState(CHAT_UNAVAILABLE_MESSAGE);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transportRef = useRef(new DefaultChatTransport({ api: "/api/chat" }));

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: transportRef.current,
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat")
      .then(async (res) => {
        const data = (await res.json()) as { available?: boolean; message?: string };
        if (cancelled) return;
        setAvailable(Boolean(data.available));
        if (data.message) setUnavailableMessage(data.message);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (available) {
      inputRef.current?.focus();
    }
  }, [available]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || available === false) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-frame)]",
        compact ? "rounded-3xl" : "rounded-none md:rounded-3xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/8 bg-white/70 px-4 py-3 backdrop-blur-sm">
        <div>
          <p id={headingId} className="text-sm font-semibold text-[var(--owkin-ink)]">
            Ask Aksh Health
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--owkin-muted)]">
            Product questions — grounded in our public docs. Not medical advice.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--owkin-ink)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        ref={listRef}
        className={cn("flex-1 space-y-3 overflow-y-auto px-4 py-4", compact ? "min-h-[280px] max-h-[360px]" : "min-h-[420px]")}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {available === false ? (
          <div className="rounded-xl border border-black/8 bg-white px-3 py-3 text-sm leading-relaxed text-steel">
            <p>{unavailableMessage}</p>
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <Link href="/contact" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                Contact
              </Link>
              <Link href="/get-started" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                Get started
              </Link>
              <Link href="/demo/patel" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                Demo
              </Link>
            </p>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-[var(--owkin-muted)]">
                  Ask about care coordination, HITL review, EMIS/SystmOne, FHIR, safety posture, demos, or how to get
                  started.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => submit(suggestion)}
                        disabled={busy || available !== true}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-left text-xs font-medium text-[var(--owkin-ink)] transition-colors hover:border-black/20 hover:bg-[var(--owkin-cream-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {messages.map((message) => {
              const text = messageText(message.parts);
              if (!text) return null;
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-[var(--owkin-ink)] text-white"
                        : "border border-black/8 bg-white text-[var(--owkin-ink)]"
                    )}
                  >
                    {text}
                  </div>
                </div>
              );
            })}

            {busy ? (
              <p className="text-xs text-[var(--owkin-muted)]" aria-live="polite">
                Thinking…
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                Something went wrong. Please try again, or use{" "}
                <Link href="/contact" className="font-medium underline-offset-4 hover:underline">
                  Contact
                </Link>
                .
              </p>
            ) : null}
          </>
        )}
      </div>

      <form
        className="border-t border-black/8 bg-white/80 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="aksh-marketing-chat-input" className="sr-only">
            Message
          </label>
          <input
            id="aksh-marketing-chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={available === false || busy}
            placeholder={available === false ? "Chat unavailable" : "Ask about Aksh Health…"}
            className="min-h-[44px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[var(--owkin-ink)] placeholder:text-[var(--owkin-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            autoComplete="off"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-[var(--owkin-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={available === false || !input.trim()}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--owkin-ink)] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--owkin-muted)]">
          Prefer a person?{" "}
          <Link href="/contact" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Contact
          </Link>{" "}
          ·{" "}
          <Link href="/get-started" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Get started
          </Link>
        </p>
      </form>
    </div>
  );
}

export function MarketingChatWidget() {
  const [open, setOpen] = useState(false);
  const [cookieVisible, setCookieVisible] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const stored = window.localStorage.getItem("aksh_cookie_consent");
    setCookieVisible(!stored);
    const onConsent = () => setCookieVisible(false);
    window.addEventListener("aksh-cookie-consent", onConsent as EventListener);
    return () => window.removeEventListener("aksh-cookie-consent", onConsent as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-6",
        cookieVisible ? "bottom-44 sm:bottom-40" : "bottom-4 sm:bottom-6"
      )}
    >
      {open ? (
        <div
          className="pointer-events-auto w-[min(100vw-2rem,24rem)]"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <MarketingChatPanel
            compact
            headingId={titleId}
            onClose={() => setOpen(false)}
            className="h-[min(70vh,32rem)]"
          />
        </div>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[var(--mk-ink)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--mk-shadow-float)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-accent)] focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-label={open ? "Close Ask Aksh Health chat" : "Open Ask Aksh Health chat"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-4 w-4" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
        <span>{open ? "Close" : "Ask"}</span>
      </button>
    </div>
  );
}
