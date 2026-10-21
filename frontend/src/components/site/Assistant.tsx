"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Close, Send, Sparkles } from "@/components/ui/icons";
import { cx } from "@/components/ui/styles";
import type { AssistantReply } from "@/lib/assistant/types";

type Message = {
  role: "user" | "assistant";
  content: string;
  links?: AssistantReply["links"];
};

const GREETING =
  "Hi! I can help you find the right service, solution or course. What does your business need?";
const SUGGESTIONS = [
  "My EBM isn't working",
  "VAT filing",
  "Courses and fees",
  "Reports for our NGO",
];

/**
 * The round button at the bottom right, and the chat panel it opens
 * (ServiceNow's AI button, Z-GATE's rules). Answers come from the
 * website's own content (src/app/api/assistant); a person is always one
 * click away. The conversation lives only in this tab: never stored.
 *
 * Accessible as a non-modal dialog: Escape or the close button closes it
 * and returns focus to the launcher; new replies are announced politely.
 */
export function Assistant({ aiMode, whatsapp }: { aiMode: boolean; whatsapp: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      launcher.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, busy]);

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const ask = async (text: string) => {
    const question = text.trim().slice(0, 1000);
    if (!question || busy) return;
    const conversation: Message[] = [...messages, { role: "user", content: question }];
    setMessages(conversation);
    setDraft("");
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.slice(-12).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = (await response.json()) as Partial<AssistantReply> & { error?: string };
      setMessages([
        ...conversation,
        response.ok && data.reply
          ? { role: "assistant", content: data.reply, links: data.links ?? [] }
          : {
              role: "assistant",
              content: data.error ?? "Something went wrong. A person can help on WhatsApp.",
            },
      ]);
    } catch {
      setMessages([
        ...conversation,
        { role: "assistant", content: "I couldn't connect. A person can help on WhatsApp." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        aria-label={open ? "Close the Z-GATE assistant" : "Ask the Z-GATE assistant"}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => (open ? close() : setOpen(true))}
        data-needs-js
        className="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 inline-flex size-14 cursor-pointer items-center justify-center rounded-full border border-gate-2/50 bg-[radial-gradient(circle_at_30%_25%,var(--color-gate-1),var(--color-ink-3))] text-white shadow-[0_12px_32px_-8px_rgb(52_224_201/0.55)] transition-transform duration-150 hover:scale-105 sm:right-6 sm:bottom-6 print:hidden"
      >
        {open ? <Close className="size-6" /> : <Sparkles className="size-7" />}
      </button>

      {open ? (
        <section
          id={`${id}-panel`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          className="fixed inset-x-2 top-20 bottom-[calc(144px+env(safe-area-inset-bottom))] z-40 flex flex-col overflow-hidden rounded-2xl border border-line bg-ink shadow-[0_32px_80px_-16px_rgb(0_0_0/0.8)] sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[min(560px,calc(100dvh-8rem))] sm:w-[380px] print:hidden"
        >
          <header className="flex items-center gap-3 border-b border-line bg-[linear-gradient(135deg,rgb(91_107_250/0.25),rgb(52_224_201/0.12))] px-4 py-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,var(--color-gate-1),var(--color-ink-3))] text-white">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-title`} className="text-base font-bold">
                Z-GATE Assistant
              </h2>
              <p className="text-xs text-paper-dim">
                {aiMode ? "AI answers from our website" : "Answers from our website"} · a person is
                one click away
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close the assistant"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-paper hover:bg-paper/8"
            >
              <Close className="size-5" />
            </button>
          </header>

          <div
            ref={log}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
          >
            <p className={bubbleAssistant}>{GREETING}</p>
            {messages.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void ask(suggestion)}
                    className="min-h-9 cursor-pointer rounded-full border border-line bg-transparent px-3 text-sm text-paper hover:border-gate-2"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : ""}>
                <p
                  className={cx(
                    "whitespace-pre-line",
                    message.role === "user" ? bubbleUser : bubbleAssistant,
                  )}
                >
                  {message.content}
                </p>
                {message.links && message.links.length > 0 ? (
                  <ul className="mt-2 grid list-none gap-1.5">
                    {message.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-paper no-underline hover:border-gate-2"
                        >
                          {link.title}
                          <ArrowRight className="size-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {busy ? (
              <p className={cx(bubbleAssistant, "text-paper-dim")} aria-label="Assistant is typing">
                …
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-line px-3 pt-3 pb-2"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(draft);
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${id}-input`} className="sr-only">
                Your question
              </label>
              <textarea
                ref={input}
                id={`${id}-input`}
                rows={1}
                maxLength={1000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask(draft);
                  }
                }}
                placeholder="Ask about EBM, VAT, courses…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-ink-2 px-4 py-2.5 text-base text-paper placeholder:text-paper-dim focus-visible:border-gate-2"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-action text-white hover:bg-action-hover disabled:cursor-default disabled:opacity-40"
              >
                <Send className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-snug text-paper-dim">
              Don&rsquo;t share passwords, tax IDs or client records.
              {aiMode ? " Questions are answered by AI, processed outside Rwanda." : null}{" "}
              <Link href="/contact" className="underline underline-offset-2">
                Start Now
              </Link>{" "}
              or{" "}
              <a href={whatsapp} className="underline underline-offset-2">
                WhatsApp
              </a>{" "}
              to reach a person.
            </p>
          </form>
        </section>
      ) : null}
    </>
  );
}

const bubbleAssistant =
  "max-w-[90%] rounded-2xl rounded-tl-sm bg-ink-2 px-3.5 py-2.5 text-sm leading-relaxed text-paper";
const bubbleUser =
  "max-w-[85%] rounded-2xl rounded-tr-sm bg-action px-3.5 py-2.5 text-sm leading-relaxed text-white";
