"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";
import { useAiChat, type ChatMessage as SharedChatMessage } from "@/hooks/use-ai-chat";

/**
 * GetSetGrades AI — subtle, secondary (audit Part 12).
 *
 * This section is intentionally NOT the main focus of the homepage.
 * GetSetGrades is primarily a tutoring/support service. The AI section is a
 * gentle "ask a quick question" surface that soft-suggests booking a
 * one-to-one session for deeper help.
 *
 * Privacy:
 *   - Conversations are NOT stored by GetSetGrades.
 *   - Prompts are sent to our AI provider (Groq) server-side only.
 *   - The server injects its own system prompt; client messages are
 *     validated (only `user` and `assistant` roles allowed).
 *
 * Implementation notes:
 *   - Self-contained: no props, no global state.
 *   - Inline rose bubble + "Try again" on error.
 *   - Max-height scroll area with `scrollbar-slim`.
 *   - Respects prefers-reduced-motion (typing dots become static).
 */

type ChatMessage = SharedChatMessage;

const SUGGESTED_PROMPTS: ReadonlyArray<{ icon: LucideIcon; prompt: string }> = [
  { icon: Sparkles, prompt: "Explain quadratic equations simply" },
  { icon: Sparkles, prompt: "Why is my Python list a `list` but my tuple isn't?" },
  { icon: Sparkles, prompt: "How do I structure a 5-paragraph essay?" },
  { icon: Sparkles, prompt: "What's a confidence interval, intuitively?" },
];

/**
 * Minimal markdown subset (paragraphs + bullet lists only). No
 * dangerouslySetInnerHTML — pure React nodes.
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
  const dots = [0, 1, 2];
  return (
    <div className="flex items-center gap-1 py-1" aria-label="GetSetGrades AI is typing">
      {dots.map((i) =>
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

function AiBubbleAvatar() {
  return (
    <div className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
      <Sparkles className="size-3.5" aria-hidden="true" />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-navy px-3.5 py-2 text-sm text-white shadow-soft">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <AiBubbleAvatar />
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-mint/30 bg-brand-mint/15 px-3.5 py-2 text-sm text-foreground">
        {renderMarkdown(message.content)}
      </div>
    </div>
  );
}

export function AiSection() {
  const { messages, isSending, error, send, retry } = useAiChat();
  const [input, setInput] = React.useState("");

  const sectionRef = React.useRef<HTMLElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, error]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const section = sectionRef.current;
      if (!section) return;
      const active =
        typeof document !== "undefined" ? document.activeElement : null;
      if (active && section.contains(active)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    send(text);
  }

  const showEmptyState = messages.length === 0 && !isSending && !error;
  const whatsappUrl = getWhatsappUrl();

  return (
    <section
      ref={sectionRef}
      id="ai"
      aria-labelledby="ai-heading"
      className="py-16 md:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeading
            eyebrow="GetSetGrades AI (beta)"
            number="AI"
            headingId="ai-heading"
            title={
              <>
                Ask a quick question.{" "}
                <span className="brand-text-gradient">Get unstuck.</span>
              </>
            }
            subtitle="A friendly AI assistant for quick academic guidance. For deeper, one-to-one support, book a session with a human tutor."
          />
        </ScrollReveal>

        <ScrollReveal delay={120} className="mt-8">
          <div className="liquid-glass rounded-3xl p-1.5 sm:p-2">
            <div className="rounded-[1.4rem] bg-card/80 p-4 sm:p-6">
              {/* Card header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base font-semibold text-foreground">
                      GetSetGrades AI
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Beta
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>

              {/* Messages area */}
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation with GetSetGrades AI"
                className="scrollbar-slim -mx-1 mt-4 max-h-80 overflow-y-auto p-1"
              >
                {showEmptyState ? (
                  <div className="grid gap-2 py-2 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map(({ prompt }) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => send(prompt)}
                        className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-brand-blue/40 hover:bg-brand-mint/10 focus-visible:border-brand-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                      >
                        <Sparkles
                          className="mt-0.5 size-4 shrink-0 text-brand-blue"
                          aria-hidden="true"
                        />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-1">
                    {messages.map((m, i) => (
                      <ChatBubble key={i} message={m} />
                    ))}

                    {isSending ? (
                      <div className="flex items-end gap-2">
                        <AiBubbleAvatar />
                        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-mint/30 bg-brand-mint/15 px-3.5 py-2 text-sm">
                          <TypingDots />
                        </div>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="flex items-end gap-2">
                        <AiBubbleAvatar />
                        <div
                          role="alert"
                          className="max-w-[85%] rounded-2xl rounded-bl-sm border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm text-rose-700"
                        >
                          <p className="whitespace-pre-wrap">{error}</p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="link"
                              className="h-auto p-0 text-rose-700 hover:text-rose-800"
                              onClick={retry}
                              disabled={isSending}
                            >
                              <RefreshCw className="size-3.5" aria-hidden="true" />
                              Try again
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Input area */}
              <form onSubmit={onSubmit} className="mt-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    aria-label="Ask GetSetGrades AI anything"
                    placeholder="Ask GetSetGrades AI anything…"
                    maxLength={1000}
                    className="flex-1 rounded-full border border-border bg-card/70 px-4 py-2.5 text-sm focus-visible:border-brand-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                  />
                  <Button
                    type="submit"
                    aria-label="Send"
                    className="size-10 rounded-full bg-brand-navy p-0 text-white hover:bg-brand-blue sm:h-10 sm:w-auto sm:px-4 sm:py-2.5 sm:p-2"
                    disabled={isSending || input.trim() === ""}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Send className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-muted-foreground">
                  GetSetGrades AI offers general academic guidance. For
                  personalised, one-to-one support, book a session.
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="h-auto px-2 py-0 text-xs"
                  >
                    <a href="#book">Book a session</a>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="h-auto px-2 py-0 text-xs"
                  >
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="size-3.5" aria-hidden="true" />
                      Chat on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default AiSection;
