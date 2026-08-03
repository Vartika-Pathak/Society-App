import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiPost } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  text: string;
}

const QUICK_REPLIES = [
  "How do I sign up and verify my account?",
  "How do I log a visitor and get them an entry OTP?",
  "How do I raise an emergency alert?",
  "What can I do from the Dashboard?",
];

// Java-backend-only feature (see api-fetch.ts) — on the Node backend this
// endpoint doesn't exist, so a failed request just shows an inline error
// in the chat rather than breaking anything else on the page.
export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (!user) return null;

  const sendMessage = async (message: string) => {
    if (!message || isSending) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setIsSending(true);

    try {
      const { reply } = await apiPost<{ reply: string }>("/api/chat/message", { message });
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "The assistant isn't available right now. Please try again later." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input.trim());
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] rounded-xl border bg-card shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary text-primary-foreground">
            <span className="font-medium text-sm">Pavilion Assistant</span>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="hover:opacity-80">
              <X className="h-4 w-4" />
            </button>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about using Pavilion, or pick a topic below:
                  </p>
                  <div className="flex flex-col gap-2">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="text-left text-sm rounded-lg border px-3 py-2 hover:bg-muted transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : m.role === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {isSending && (
                <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%] flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="border-t p-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a question…"
              className="min-h-[2.5rem] max-h-24 resize-none text-sm"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open chat assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
