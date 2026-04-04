"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  providers?: any[];
  timestamp: Date;
}

interface AIChatInterfaceProps {
  userId: number;
  userName?: string;
}

export default function AIChatInterface({ userId, userName }: AIChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const storedSession = sessionStorage.getItem(`glowsense_chat_session_${userId}`);
        if (!storedSession) {
          setChatLoaded(true);
          return;
        }

        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/rag/history/session/${storedSession}?user_id=${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.messages) {
            // Map strings into JS Date objects
            const loadedMsgs = data.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              providers: m.providers,
              timestamp: new Date(m.timestamp)
            }));
            setMessages(loadedMsgs);
          }
          if (data && data.session_id) {
            setSessionId(data.session_id);
          }
        }
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setChatLoaded(true);
      }
    };
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message to chat
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch("http://localhost:8000/rag/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
        console.error("Backend error:", errorData);
        throw new Error(errorData.detail || `Failed to get AI response (${response.status})`);
      }

      const data = await response.json();

      // Update session ID if provided
      if (data.session_id) {
        setSessionId(data.session_id);
        sessionStorage.setItem(`glowsense_chat_session_${userId}`, data.session_id.toString());
      }

      // Add AI response to chat
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "I'm here to help you find the perfect service provider!",
        providers: data.providers || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error.message || "Sorry, I'm having trouble connecting. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header removed for total immersion */}
      <div className="flex-1 flex flex-col p-0 min-h-0 relative">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 space-y-6 min-h-0 w-full scroll-smooth pb-32">
          {!chatLoaded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center w-full px-4 mt-12 md:mt-24">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Hey {userName || "there"}, how can I help you today?</h1>
              <p className="text-muted-foreground mb-8 text-lg">
                I can recommend the perfect service providers based on your specific needs, location, and budget.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div onClick={() => { setInput("I need a makeup artist for my wedding"); }} className="cursor-pointer text-left p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">Find a bridal makeup artist</p>
                  <p className="text-xs text-muted-foreground mt-1">Recommend top-rated experts near me</p>
                </div>
                <div onClick={() => { setInput("Who offers the best keratin treatment under $100?"); }} className="cursor-pointer text-left p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">Affordable keratin treatments</p>
                  <p className="text-xs text-muted-foreground mt-1">Search within my specific budget</p>
                </div>
                <div onClick={() => { setInput("I have sensitive skin, any skincare experts nearby?"); }} className="cursor-pointer text-left p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">Specialists for sensitive skin</p>
                  <p className="text-xs text-muted-foreground mt-1">Match with specialized estheticians</p>
                </div>
                <div onClick={() => { setInput("Need a quick haircut in Faisalabad"); }} className="cursor-pointer text-left p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">Quick haircut appointments</p>
                  <p className="text-xs text-muted-foreground mt-1">Find available local hairstylists</p>
                </div>
              </div>
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div
                className={`max-w-[92%] md:max-w-[88%] rounded-2xl p-4 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-background border rounded-tl-sm"
                }`}
              >
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className={i === 0 ? "mt-0" : "mt-2"}>{line}</p>
                  ))}
                </div>
                {message.providers && message.providers.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-bold flex items-center gap-2">
                       <Sparkles className="h-4 w-4" /> Top Provider Matches
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {message.providers.map((provider: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-muted/40 border rounded-xl p-3 hover:bg-primary/5 hover:border-primary/50 transition-colors shadow-sm cursor-pointer group"
                          onClick={() => router.push(`/dashboard/providers?id=${provider.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-base truncate pr-2 group-hover:text-primary transition-colors">
                              {provider.business_name || provider.full_name}
                            </p>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          {provider.city && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              📍 {provider.city}
                            </p>
                          )}
                          {provider.services && (
                            <div className="mt-2 text-xs border-t pt-2">
                               <p className="font-semibold text-muted-foreground mb-1">Services:</p>
                               <p className="line-clamp-2">{provider.services}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 flex-row">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-background border rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area floating ultra-tight to bottom */}
        <div className="px-4 pb-2 pt-10 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none">
          <div className="max-w-6xl mx-auto relative flex items-center bg-background/90 backdrop-blur-md border-2 border-primary/40 hover:border-primary/60 rounded-full pl-6 pr-2 py-1 shadow-2xl focus-within:ring-4 focus-within:ring-primary/20 transition-all pointer-events-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message GlowSense AI..."
              disabled={loading}
              className="flex-1 min-h-[48px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 py-2 text-base placeholder:text-muted-foreground"
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              size="icon"
              className="h-12 w-12 rounded-full shrink-0 shadow-lg bg-primary hover:bg-primary/90 text-white transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 ml-[-2px]" />
              )}
            </Button>
          </div>
          <div className="text-center mt-3">
             <p className="text-xs text-muted-foreground/70 font-medium">AI can make mistakes. Verify important providers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

