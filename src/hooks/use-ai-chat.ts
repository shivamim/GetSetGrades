"use client";

import * as React from "react";

/**
 * Shared AI chat client logic (used by both the inline AI section and the
 * floating bottom-left AI chat FAB) so the two surfaces stay in sync and
 * never drift into two different API contracts.
 *
 * Privacy: conversations are NOT persisted client-side beyond the current
 * page session (in-memory React state only) and are NOT stored by
 * GetSetGrades server-side either — see /api/ai-chat.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export const AI_FRIENDLY_ERROR =
  "Sorry, something went wrong. Please try again.";

interface AiChatSuccess {
  ok: true;
  reply: string;
  reference: string;
}

interface AiChatError {
  ok: false;
  error?: string;
  errors?: Record<string, string>;
  logId?: string;
}

type AiChatResponse = AiChatSuccess | AiChatError;

function extractApiError(data: unknown): { message: string; logId?: string } {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const logId = typeof d.logId === "string" ? d.logId : undefined;
    if (typeof d.error === "string" && d.error.length > 0) {
      return { message: d.error, logId };
    }
    if (d.errors && typeof d.errors === "object") {
      const errs = d.errors as Record<string, unknown>;
      for (const v of Object.values(errs)) {
        if (typeof v === "string" && v.length > 0) {
          return { message: v, logId };
        }
      }
    }
  }
  return { message: AI_FRIENDLY_ERROR };
}

async function postChat(payload: {
  messages: Array<{ role: ChatRole; content: string }>;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(AI_FRIENDLY_ERROR);
  }
  const data = (await res.json().catch(() => null)) as AiChatResponse | null;
  if (!res.ok || !data) {
    const { message, logId } = extractApiError(data);
    throw new Error(logId ? `${message} (Reference: ${logId})` : message);
  }
  if (data.ok === false) {
    const { message, logId } = extractApiError(data);
    throw new Error(logId ? `${message} (Reference: ${logId})` : message);
  }
  if (typeof data.reply !== "string" || data.reply.length === 0) {
    throw new Error(AI_FRIENDLY_ERROR);
  }
  return data.reply;
}

export function useAiChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastPayloadRef = React.useRef<{
    messages: Array<{ role: ChatRole; content: string }>;
  } | null>(null);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      const payload = {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      };
      lastPayloadRef.current = payload;

      setMessages(nextMessages);
      setError(null);
      setIsSending(true);

      try {
        const reply = await postChat(payload);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : AI_FRIENDLY_ERROR);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages],
  );

  const retry = React.useCallback(async () => {
    if (isSending || !lastPayloadRef.current) return;
    setError(null);
    setIsSending(true);
    try {
      const reply = await postChat(lastPayloadRef.current);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : AI_FRIENDLY_ERROR);
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  return { messages, isSending, error, send, retry };
}
