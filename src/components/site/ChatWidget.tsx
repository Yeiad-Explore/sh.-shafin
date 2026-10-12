"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSite } from "./SiteProvider";
import ThoughtLine from "./ThoughtLine";

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** Trace shown in the ThoughtLine above an assistant reply. */
  steps?: string[];
  /** Seconds it thought for, frozen once the reply starts. */
  thought?: number;
}

// What the server does between the question and the first word of the answer.
const STEPS = ["Reading your question", "Checking Shafin's courses, batches and fees", "Writing the answer"];
const STEP_AT_MS = [0, 700, 1600];

const SUGGESTIONS = ["Which batches still have seats?", "How do I book a free trial class?", "What are the fees?", "Explain photosynthesis simply"];

/** Renders the assistant's plain text: paragraphs, "- " bullets and **bold**. */
function Rich({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length}>{list.map((li, i) => <li key={i}>{inline(li)}</li>)}</ul>);
    list = [];
  };
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}

export default function ChatWidget() {
  const { data } = useSite();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 3400);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy, error]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Ask the server how many questions are left today the first time the panel opens.
  useEffect(() => {
    if (!open || remaining !== null) return;
    let live = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { enabled: boolean; remaining: number; limit: number }) => {
        if (!live) return;
        setLimit(j.limit);
        setRemaining(j.remaining);
        if (!j.enabled) setError("Shafin AI is unavailable right now. Please use the Contact form.");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open, remaining]);

  const exhausted = remaining === 0;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || exhausted) return;
    const history: Msg[] = [...msgs, { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "", steps: [STEPS[0]] }]);
    setInput("");
    setError(null);
    setBusy(true);

    const patchLast = (fn: (m: Msg) => Msg) => setMsgs((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));
    const stepTimers = STEP_AT_MS.slice(1).map((ms, i) =>
      setTimeout(() => patchLast((m) => (m.content ? m : { ...m, steps: STEPS.slice(0, i + 2) })), ms),
    );

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });
      const left = res.headers.get("X-Chat-Remaining");
      if (left !== null) setRemaining(Number(left));
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        if (typeof body?.remaining === "number") setRemaining(body.remaining);
        throw new Error(body?.error || "Shafin AI is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        stepTimers.forEach(clearTimeout);
        const text = reply;
        patchLast((m) => ({ ...m, content: text }));
      }
      if (!reply.trim()) throw new Error("No reply came back. Please try again.");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMsgs(history);
      setError((err as Error).message);
    } finally {
      stepTimers.forEach(clearTimeout);
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  if (data.settings.chat_enabled === false) return null;

  const contactHint = data.settings.whatsapp ? "the Contact form or WhatsApp" : "the Contact form";

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`chat-launch ${shown ? "is-in" : ""} ${open ? "is-open" : ""}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close Shafin AI" : "Ask Shafin AI"}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          {open ? (
            <path d="M9 9l14 14M23 9L9 23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path
              d="M6 7.5h20a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14l-6 4.5V22.5H6A1.5 1.5 0 0 1 4.5 21V9A1.5 1.5 0 0 1 6 7.5zM10 13.5h12M10 17.5h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {!open && <span className="chat-launch__tip t-label">Ask Shafin AI</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="chat-panel"
            className="chat"
            role="dialog"
            aria-label="Shafin AI"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduce ? 0.12 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="chat__head">
              <div>
                <p className="chat__kicker t-label">Shafin AI · Assistant</p>
                <h2 className="chat__title">Ask about the classes</h2>
              </div>
              <button type="button" className="chat__close" onClick={close} aria-label="Close Shafin AI">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div ref={listRef} className="chat__list" data-lenis-prevent="" aria-live="polite">
              <div className="chat__msg chat__msg--bot">
                <p>
                  Hi, I&apos;m Shafin AI. I can answer questions about Shafin&apos;s Biology, Physics, Chemistry and Math classes: courses, batches, fees and
                  free trials. I can also explain a science topic. You can write in English or বাংলা.
                </p>
              </div>
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="chat__msg chat__msg--user">
                    <p>{m.content}</p>
                  </div>
                ) : (
                  <div key={i} className="chat__turn">
                    {m.steps && (
                      <ThoughtLine
                        className="chat__thought"
                        working={!m.content}
                        steps={m.steps}
                        elapsed={m.thought}
                        onSettle={(sec) => setMsgs((prev) => prev.map((x, j) => (j === i ? { ...x, thought: sec } : x)))}
                        fontSize={13}
                        color="var(--page-fg-2)"
                        glyphColor="var(--accent)"
                        settleDuration={400}
                      />
                    )}
                    {m.content && (
                      <div className="chat__msg chat__msg--bot">
                        <Rich text={m.content} />
                      </div>
                    )}
                  </div>
                ),
              )}
              {error && (
                <p className="chat__error" role="alert">
                  {error}
                </p>
              )}
              {exhausted && !error && (
                <p className="chat__error" role="status">
                  You&apos;ve used today&apos;s {limit} questions. Come back tomorrow, or reach Shafin through {contactHint}.
                </p>
              )}
              {!msgs.length && !exhausted && (
                <div className="chat__chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chat__chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form className="chat__form" onSubmit={onSubmit}>
              <label htmlFor="chat-input" className="sr-only">
                Your question
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                maxLength={1000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={exhausted}
                placeholder={exhausted ? "No questions left today" : "Type your question…"}
              />
              <button type="submit" className="chat__send" disabled={busy || exhausted || !input.trim()} aria-label="Send">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
