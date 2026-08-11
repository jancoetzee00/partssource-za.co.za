/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, PartListing } from "../types";
import { MessageSquare, Send, X, Bot, Hammer, Sparkles, Phone, ArrowUpRight } from "lucide-react";

interface DiagnosticAdvisorProps {
  onSelectListing: (id: string) => void;
  listings: PartListing[];
}

export const DiagnosticAdvisor: React.FC<DiagnosticAdvisorProps> = ({ onSelectListing, listings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Ahoj! I'm your Partssource ZA AI Mechanic. 🇿🇦⚙️\n\nTell me about your vehicle problem or what part you are trying to find (e.g., 'My Toyota Hilux is blowing smoke' or 'Looking for Scania rear airbags'). I'll diagnose the issue and match you with listings currently live in our marketplace!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: data.advice || "Sorry, I couldn't process that. Please ask about standard parts or conditions.",
        suggestedParts: data.suggestedParts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("AI Advisor call failed:", err);
      const errorMessage: ChatMessage = {
        id: `msg-err`,
        sender: "assistant",
        text: "I am having trouble connecting to the Partssource ZA AI system right now. However, you can use the filters on the left to find your engine parts, suspension spares, and heavy-duty truck accessories directly!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Find listing helper for suggested cards in chat
  const getListingById = (id: string) => {
    return listings.find(l => l.id === id);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-950 hover:bg-blue-600 text-white font-display font-medium px-5 py-4.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 group border border-slate-800 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 group-hover:bg-white rounded-full animate-ping" />
          </div>
          <span>AI Spares Advisor</span>
        </button>
      )}

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 text-white shadow-2xl flex flex-col border-l border-slate-700/80 animate-slide-in">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm tracking-wide flex items-center gap-1.5">
                  SparesAdvisor AI
                  <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full uppercase font-bold">
                    PRO
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Automotive Diagnostic & Parts Matcher</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Info Bar */}
          <div className="bg-blue-600 text-white text-[11px] px-4 py-2 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI scans live listings for compatible car & truck accessories instantly!</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m) => {
              const isBot = m.sender === "assistant";
              return (
                <div key={m.id} className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] text-slate-400">
                      {isBot ? "SparesAdvisor" : "You"} • {m.timestamp}
                    </span>
                  </div>
                  
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm ${
                    isBot 
                      ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60" 
                      : "bg-blue-600 text-white rounded-tr-none font-medium"
                  }`}>
                    {/* Preserve line breaks */}
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                    {/* Matched Spares Container */}
                    {isBot && m.suggestedParts && m.suggestedParts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2">
                        <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase block mb-1">
                          ⚡ Matches Found in Marketplace:
                        </span>
                        {m.suggestedParts.map((partId) => {
                          const part = getListingById(partId);
                          if (!part) return null;
                          return (
                            <div 
                              key={part.id}
                              onClick={() => {
                                onSelectListing(part.id);
                                setIsOpen(false); // optionally close advisor
                              }}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between group/part"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <img 
                                  src={part.images[0]} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover rounded-md shrink-0 border border-slate-800"
                                />
                                <div className="overflow-hidden">
                                  <h4 className="text-xs font-semibold text-white truncate group-hover/part:text-amber-400">
                                    {part.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-400">{part.location}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="text-xs font-bold text-blue-400 block">
                                  R{part.price.toLocaleString("en-ZA")}
                                </span>
                                <span className="text-[8px] text-slate-500 flex items-center gap-0.5 justify-end uppercase">
                                  View <ArrowUpRight className="w-2 h-2" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-400 mb-1">SparesAdvisor AI is analyzing...</span>
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700/60 flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-300">Checking vehicle diagnosis & matching spares...</span>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-850 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Toyota Hilux blowing black smoke / Scania R480 clutch..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
