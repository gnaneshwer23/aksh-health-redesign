"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PatientChatAudience } from "@/lib/chat/patient-access";
import {
  PATIENT_CHAT_UNAVAILABLE_MESSAGE,
  suggestedPromptsForAudience,
} from "@/lib/chat/patient-prompt";
import { cn } from "@/lib/utils";

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

export type AskAkshPanelProps = {
  patientId: string | null;
  patientLabel?: string | null;
  audience?: PatientChatAudience;
  className?: string;
  headingId?: string;
  /** Compact embedded mode (e.g. patient companion tab). */
  embedded?: boolean;
};

type AvailabilityState = {
  available: boolean | null;
  message: string;
  accessAllowed: boolean | null;
  accessReason: string | null;
};

function AskAkshHonestyBanner() {
  return (
    <p
      role="status"
      data-testid="ask-aksh-honesty"
      className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-950"
    >
      Assisted review · not a diagnosis · drafts need Accept · liveEmis:false · synthetic/mock when graph
      is offline.
    </p>
  );
}

function AskAkshHeader(props: {
  headingId?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-2 pr-8">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircle className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p id={props.headingId} className="text-sm font-semibold text-foreground">
          {props.title}
        </p>
        <p className="text-xs text-muted">{props.subtitle}</p>
      </div>
    </div>
  );
}

function AskAkshChatSession({
  patientId,
  patientLabel,
  audience,
  headingId,
  embedded,
}: {
  patientId: string;
  patientLabel?: string | null;
  audience: PatientChatAudience;
  headingId?: string;
  embedded: boolean;
}) {
  const [input, setInput] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({
    available: null,
    message: PATIENT_CHAT_UNAVAILABLE_MESSAGE,
    accessAllowed: null,
    accessReason: null,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const suggestions = useMemo(() => suggestedPromptsForAudience(audience), [audience]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/patient",
        credentials: "include",
        body: {
          patientId,
          audience,
        },
      }),
    [patientId, audience]
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: `ask-aksh:${audience}:${patientId}`,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const canChat = availability.available === true && availability.accessAllowed !== false;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ patientId, audience });
    fetch(`/api/chat/patient?${params.toString()}`, { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json()) as {
          available?: boolean;
          message?: string;
          access?: { allowed?: boolean; reason?: string };
        };
        if (cancelled) return;
        setAvailability({
          available: Boolean(data.available),
          message: data.message ?? PATIENT_CHAT_UNAVAILABLE_MESSAGE,
          accessAllowed: data.access?.allowed ?? res.ok,
          accessReason: data.access?.reason ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability({
            available: false,
            message: PATIENT_CHAT_UNAVAILABLE_MESSAGE,
            accessAllowed: false,
            accessReason: "Could not reach Ask Aksh",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, audience]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (canChat) inputRef.current?.focus();
  }, [canChat, patientId]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || !canChat) return;
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <>
      <div className="shrink-0 space-y-2 border-b border-border-subtle px-4 py-3">
        <AskAkshHeader
          headingId={headingId}
          title="Ask Aksh"
          subtitle={
            audience === "patient"
              ? "Your care companion — assisted information only"
              : `About ${patientLabel?.trim() || patientId}`
          }
        />
        <AskAkshHonestyBanner />
      </div>

      <div
        ref={listRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto px-4 py-4",
          embedded ? "min-h-[220px] max-h-[420px]" : "min-h-0"
        )}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {availability.accessAllowed === false ? (
          <div
            className="rounded-xl border border-border-subtle bg-muted/20 px-3 py-3 text-sm text-muted"
            data-testid="ask-aksh-access-denied"
            role="alert"
          >
            {availability.accessReason ??
              "Your role cannot open named patient chat (ICS / researcher / admin default off)."}
          </div>
        ) : availability.available === false ? (
          <div className="rounded-xl border border-border-subtle bg-muted/20 px-3 py-3 text-sm text-muted">
            {availability.message}
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted">
                  {audience === "patient"
                    ? "Ask about medications, readings, or when to contact your care team. This is not medical advice."
                    : "Diabetes-aware prompts for meds/GUARDIAN, HbA1c, risks, review queue, and timeline."}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => submit(suggestion)}
                        disabled={!canChat || busy}
                        className="rounded-full border border-border-subtle bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                        data-testid="ask-aksh-suggestion"
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
                <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-subtle bg-background text-foreground"
                    )}
                  >
                    {text}
                  </div>
                </div>
              );
            })}

            {busy ? (
              <p className="text-xs text-muted" aria-live="polite">
                Thinking…
              </p>
            ) : null}

            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                Something went wrong. Please try again.
              </p>
            ) : null}
          </>
        )}
      </div>

      <form
        className="shrink-0 border-t border-border-subtle bg-background/80 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">
            Message Ask Aksh
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            value={input}
            rows={2}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
            disabled={!canChat || busy}
            placeholder={
              availability.accessAllowed === false
                ? "Chat not available for this role"
                : audience === "patient"
                  ? "Ask about your care…"
                  : "Ask about this patient…"
            }
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            autoComplete="off"
            data-testid="ask-aksh-input"
          />
          {busy ? (
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => stop()}>
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              className="min-h-[44px] min-w-[44px]"
              disabled={!canChat || !input.trim()}
              aria-label="Send message"
              data-testid="ask-aksh-send"
            >
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </>
  );
}

export function AskAkshPanel({
  patientId,
  patientLabel,
  audience = "clinician",
  className,
  headingId,
  embedded = false,
}: AskAkshPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-card",
        embedded ? "rounded-xl border border-border-subtle" : "",
        className
      )}
      data-testid="ask-aksh-panel"
    >
      {!patientId ? (
        <>
          <div className="shrink-0 space-y-2 border-b border-border-subtle px-4 py-3">
            <AskAkshHeader
              headingId={headingId}
              title="Ask Aksh"
              subtitle="Select a patient to start"
            />
            <AskAkshHonestyBanner />
          </div>
          <div
            className="flex flex-1 items-center justify-center px-4 py-8"
            data-testid="ask-aksh-empty-patient"
          >
            <p className="rounded-xl border border-dashed border-border-subtle bg-muted/20 px-3 py-6 text-center text-sm text-muted">
              Select a patient first to ask about their chart.
            </p>
          </div>
        </>
      ) : (
        <AskAkshChatSession
          key={`${audience}:${patientId}`}
          patientId={patientId}
          patientLabel={patientLabel}
          audience={audience}
          headingId={headingId}
          embedded={embedded}
        />
      )}
    </div>
  );
}
