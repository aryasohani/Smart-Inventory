import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { useUiStore } from "@/app/store/uiStore";
import { aiApi } from "@/app/services/api";
import type { ChatMessage } from "@/app/services/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Which products will run out soon?",
  "Show me top demand this week",
  "Create PO for low stock items",
  "Which products expire soon?",
];

export function AiChatDock() {
  const { chatOpen, setChatOpen } = useUiStore();
  const [messages, setMessages] = useState<ChatMessage[]>(() => aiApi.seed());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (history: ChatMessage[]) => aiApi.chat(history),
    onSuccess: (msg) => setMessages((m) => [...m, msg]),
  });

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || mutation.isPending) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: value,
      createdAt: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    mutation.mutate(next);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  return (
    <>
      {/* Floating launcher when closed */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 size-14 rounded-2xl bg-gradient-gold grid place-items-center shadow-glow hover:scale-105 transition-transform"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="size-6 text-primary-foreground" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-success border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] glass rounded-2xl shadow-elegant flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="size-9 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm flex items-center gap-2">
                  SmartStore AI
                  <span className="size-1.5 rounded-full bg-success" />
                </div>
                <div className="text-[11px] text-muted-foreground">Powered by demand-aware reasoning</div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="size-8 grid place-items-center rounded-lg hover:bg-muted/40 text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.map((m) => (
                <ChatBubble key={m.id} msg={m} />
              ))}
              {mutation.isPending && <TypingBubble />}
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="px-3 py-3 border-t border-border bg-card/50"
            >
              <div className="flex items-center gap-2 rounded-xl border border-border bg-input/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30 transition-all px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about stock, suppliers, forecasts..."
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || mutation.isPending}
                  className="size-7 grid place-items-center rounded-lg bg-gradient-gold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="size-7 rounded-lg bg-gradient-gold grid place-items-center shrink-0 mt-0.5">
          <Bot className="size-3.5 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-gold text-primary-foreground rounded-br-md"
            : "bg-muted/50 text-foreground rounded-bl-md border border-border"
        )}
      >
        <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
        {msg.toolCall && (
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] flex items-center gap-1.5 opacity-70">
            <Sparkles className="size-2.5" />
            <code>{msg.toolCall.name}</code>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2 items-end">
      <div className="size-7 rounded-lg bg-gradient-gold grid place-items-center shrink-0">
        <Bot className="size-3.5 text-primary-foreground" />
      </div>
      <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}

// Lightweight markdown renderer (bold + lists + italics)
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="text-primary bg-black/30 px-1 py-0.5 rounded text-[11px]">$1</code>');
    return (
      <div key={i} dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }} />
    );
  });
}
