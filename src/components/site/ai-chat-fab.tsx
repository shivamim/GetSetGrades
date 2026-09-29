"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, RefreshCw, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat";

/**
 * Floating GetSetGrades AI launcher, bottom-left (mirrors the WhatsApp FAB,
 * which stays bottom-right, so the two never collide).
 *
 * Opens a compact glass chat popover. Uses the same `/api/ai-chat` contract
 * and privacy model as the inline AI section (conversations are not stored
 * by GetSetGrades; see the AI section / Privacy Policy for details).
 */

function renderMarkdown(content: string): React.ReactNode {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const nonEmpty = lines.filter((l) => l.trim().length > 0);
        const isBulletList =
          nonEmpty.length > 0 &&
          nonEmpty.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4">
              {nonEmpty.map((l, j) => (
                <li key={j}>{l.trim().replace(/^[-*]\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-1 py-1" aria-label="GetSetGrades AI is typing">
      {[0, 1, 2].map((i) =>
        reduce ? (
          <span key={i} className="size-1.5 rounded-full bg-foreground/40" />
        ) : (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-foreground/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
          />
        ),
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-navy px-3.5 py-2 text-sm text-white shadow-soft">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-mint/30 bg-brand-mint/15 px-3.5 py-2 text-sm text-foreground">
        {renderMarkdown(message.content)}
      </div>
    </div>
  );
}

export function AiChatFab() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const { messages, isSending, error, send, retry } = useAiChat();
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, isSending, error, reduce]);

  React.useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    send(text);
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 md:bottom-6 md:left-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="liquid-glass mb-3 w-[calc(100vw-2.5rem)] max-w-sm rounded-3xl p-1.5 sm:p-2"
            role="dialog"
            aria-modal="false"
            aria-label="GetSetGrades AI chat"
          >
            <div className="rounded-[1.4rem] bg-card/90 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      GetSetGrades AI
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Quick academic help, anytime
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close GetSetGrades AI chat"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation with GetSetGrades AI"
                className="scrollbar-slim -mx-1 mt-3 h-72 overflow-y-auto p-1"
              >
                {messages.length === 0 && !isSending && !error ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center">
                    <div className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
                      <Sparkles className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Ask me anything academic
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quick guidance now. For deeper help, book a session with
                      a tutor.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-1">
                    {messages.map((m, i) => (
                      <Bubble key={i} message={m} />
                    ))}
                    {isSending ? (
                      <div className="flex items-end gap-2">
                        <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
                          <Sparkles className="size-3.5" aria-hidden="true" />
                        </div>
                        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-mint/30 bg-brand-mint/15 px-3.5 py-2 text-sm">
                          <TypingDots />
                        </div>
                      </div>
                    ) : null}
                    {error ? (
                      <div
                        role="alert"
                        className="rounded-2xl rounded-bl-sm border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm text-rose-700"
                      >
                        <p className="whitespace-pre-wrap">{error}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="link"
                          className="mt-1 h-auto p-0 text-rose-700 hover:text-rose-800"
                          onClick={retry}
                          disabled={isSending}
                        >
                          <RefreshCw className="size-3.5" aria-hidden="true" />
                          Try again
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <form onSubmit={onSubmit} className="mt-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    aria-label="Ask GetSetGrades AI anything"
                    placeholder="Type your question…"
                    maxLength={1000}
                    className="flex-1 rounded-full border border-border bg-card/70 px-3.5 py-2 text-sm focus-visible:border-brand-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                  />
                  <Button
                    type="submit"
                    aria-label="Send"
                    className="size-9 shrink-0 rounded-full bg-brand-navy p-0 text-white hover:bg-brand-blue"
                    disabled={isSending || input.trim() === ""}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </form>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Conversations aren&apos;t stored by GetSetGrades.{" "}
                <a href="#book" className="underline underline-offset-2">
                  Book a tutor
                </a>{" "}
                for deeper help.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close GetSetGrades AI chat" : "Open GetSetGrades AI chat"}
        aria-expanded={open}
        className="glass-card relative flex size-12 items-center justify-center rounded-full shadow-soft-lg transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:h-auto md:w-auto md:gap-2 md:rounded-full md:py-2 md:pl-3 md:pr-4"
      >
        {!open ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand-blue md:right-1 md:top-1"
          >
            <span className="animate-ping absolute inset-0 rounded-full bg-brand-blue opacity-75" />
          </span>
        ) : null}
        {open ? (
          <X className="size-5 text-brand-navy" aria-hidden="true" />
        ) : (
          <Sparkles className="size-5 text-brand-navy" aria-hidden="true" />
        )}
        <span className="hidden text-sm font-medium text-foreground md:inline">
          {open ? "Close" : "GetSetGrades AI"}
        </span>
      </button>
    </div>
  );
}

export default AiChatFab;
