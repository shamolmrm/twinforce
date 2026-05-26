import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, CheckCheck } from "lucide-react";

type Msg = {
  id: string;
  from: "user" | "agent";
  text: string;
  time: string;
};

const STORAGE_KEY = "twinforce_livechat_v1";

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const quickReplies = [
  "How does pricing work?",
  "Book a demo",
  "Enterprise security",
  "Talk to a human",
];

const cannedReply = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("price") || t.includes("pricing") || t.includes("cost"))
    return "Our plans start at $30/mo (Basic), $79/mo (Pro), $149/mo (Business). Enterprise is custom — want me to send details?";
  if (t.includes("demo") || t.includes("book"))
    return "Awesome! Drop your work email and we'll set up a 20-min demo within 24 hours.";
  if (t.includes("security") || t.includes("enterprise") || t.includes("soc"))
    return "We're SOC2 Type II, support SSO/SAML, and offer on-premise deployment for Enterprise. Want our security one-pager?";
  if (t.includes("human") || t.includes("agent") || t.includes("support"))
    return "Connecting you to a human teammate — they typically reply within 5 minutes during business hours.";
  if (t.includes("hi") || t.includes("hello") || t.includes("hey"))
    return "Hey there! 👋 How can the TwinForce team help you today?";
  return "Got it — a teammate will follow up shortly. Meanwhile, anything specific I can help with?";
};

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      from: "agent",
      text: "Hi! I'm Aria from TwinForce. How can we help you today?",
      time: nowTime(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      from: "user",
      text: clean,
      time: nowTime(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const reply: Msg = {
        id: `a-${Date.now()}`,
        from: "agent",
        text: cannedReply(clean),
        time: nowTime(),
      };
      setMessages((m) => [...m, reply]);
      setTyping(false);
      if (!open) setUnread((u) => u + 1);
    }, 900 + Math.random() * 700);
  };

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((o) => !o)}
        className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
            {unread}
          </span>
        )}
      </button>

      <div
        className={
          "fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-200 sm:right-6 " +
          (open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0")
        }
        role="dialog"
        aria-label="Live chat"
      >
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/15 via-accent/10 to-transparent px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-sm font-semibold leading-tight">
                Chat with TwinForce
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  Online · Replies in a few minutes
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="h-80 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={"flex flex-col " + (m.from === "user" ? "items-end" : "items-start")}
            >
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed " +
                  (m.from === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground")
                }
              >
                {m.text}
              </div>
              <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                <span>{m.time}</span>
                {m.from === "user" && <CheckCheck className="h-3 w-3 text-primary" />}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60" />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-border bg-background/50 px-3 py-1 text-[11px] text-foreground/90 transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border bg-background/40 px-3 py-2.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="border-t border-border bg-background/30 px-4 py-1.5 text-center text-[10px] text-muted-foreground">
          Powered by TwinForce Support
        </div>
      </div>
    </>
  );
}