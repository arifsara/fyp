"use client";

import { useState } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I'm your GlowSense Concierge. Tell me about your skin or hair concerns, and I'll recommend the perfect verified expert for you." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "ai", content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I'm having trouble connecting to the server right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Smart Booking Assistant</h1>
          <p className="text-sm text-muted-foreground">RAG-Powered Recommendations</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-white border border-border shadow-sm mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-[80%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === "user" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm whitespace-pre-wrap",
              msg.role === "user" 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-muted/50 text-foreground rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-3 rounded-2xl bg-muted/50 rounded-tl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-75" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="E.g., 'I need a specialist for dry skin and acne...'"
          className="flex-1 h-12"
        />
        <Button onClick={handleSend} disabled={isLoading} size="icon" className="h-12 w-12">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

