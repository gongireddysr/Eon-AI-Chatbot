"use client";

import { useState, useEffect, useRef } from "react";

export interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

interface TopicsSidebarProps {
  topics: string[];
  title: string;
  accentColor: string;
}

export function TopicsSidebar({ topics, title }: TopicsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: Bottom toggle bar
  if (isMobile) {
    return (
      <>
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed bottom-4 left-4 z-50 sidebar-pill px-4 py-3 flex items-center gap-2 text-white text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Topics</span>
        </button>

        {/* Mobile Expanded Panel */}
        {isExpanded && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 max-h-[60vh] sidebar-pill rounded-t-3xl rounded-b-none p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
              <div className="overflow-y-auto max-h-[40vh] space-y-2 topics-scrollbar">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 text-gray-300 rounded-xl text-sm transition-all duration-300 cursor-pointer hover:text-white hover:bg-white/10"
                  >
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: Floating vertical pill - foldable on hover
  return (
    <div 
      className="fixed left-4 top-1/2 -translate-y-1/2 z-30 sidebar-pill py-4 hidden md:flex flex-col gap-3 max-h-[85vh] overflow-hidden transition-all duration-300"
      style={{ 
        width: isExpanded ? "280px" : "60px",
        paddingLeft: isExpanded ? "16px" : "8px",
        paddingRight: isExpanded ? "16px" : "8px",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Title - only show when expanded */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0"}`}>
        <h2 className="text-base font-semibold text-white px-2 pb-2 border-b border-white/10">{title}</h2>
      </div>
      
      {/* Topics */}
      <div className="flex-1 overflow-y-auto topics-scrollbar w-full space-y-1">
        {topics.map((topic, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 py-2.5 text-gray-200 rounded-xl text-sm transition-all duration-300 cursor-pointer hover:text-white hover:bg-white/10 ${isExpanded ? "px-3" : "px-2 justify-center"}`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
            {isExpanded && <span className="leading-relaxed">{topic}</span>}
          </div>
        ))}
      </div>
      
      {/* Expand indicator when collapsed */}
      {!isExpanded && (
        <div className="text-gray-400 text-xs flex justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  accentColor: string;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`${isUser ? "max-w-[70%]" : "max-w-[85%]"} px-5 py-4 rounded-2xl transition-all duration-300`}
        style={{
          background: isUser 
            ? "linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(0, 210, 255, 0.1) 100%)"
            : "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: isUser 
            ? "1px solid rgba(0, 210, 255, 0.3)" 
            : "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: isUser 
            ? "0 0 20px -5px rgba(0, 210, 255, 0.2)" 
            : "none",
        }}
      >
        <div className="whitespace-pre-line leading-7 text-[15px] text-white/90">
          {message.text}
        </div>
      </div>
    </div>
  );
}

interface FloatingInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  accentColor: string;
  hasMessages: boolean;
}

export function FloatingInput({
  input,
  setInput,
  onSend,
  placeholder,
  hasMessages,
}: FloatingInputProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (hasMessages && !isAnimating) {
      setIsAnimating(true);
    }
  }, [hasMessages, isAnimating]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className="fixed left-0 md:left-20 right-0 px-4 md:px-6 pb-4 md:pb-6 transition-all duration-500 ease-in-out z-20"
      style={{
        bottom: hasMessages ? "0" : "50%",
        transform: hasMessages ? "translateY(0)" : "translateY(50%)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="command-bar flex items-center gap-2 pl-5 pr-2 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 py-3 text-white bg-transparent focus:outline-none text-[15px] placeholder-gray-500"
          />
          {/* Nested circular send button */}
          <button
            onClick={onSend}
            className="send-btn-circle flex-shrink-0"
            aria-label="Send message"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  accentColor: string;
  emptyStateText: string;
}

export function ChatMessages({ messages, accentColor, emptyStateText }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-20 pb-32 md:pb-40 custom-scrollbar md:ml-16">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4" style={{ marginBottom: "140px" }}>
            <p className="text-gray-500 text-base md:text-lg font-light">
              {emptyStateText}
            </p>
            <p className="text-gray-600 text-xs md:text-sm mt-2">
              Type your question below to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} accentColor={accentColor} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

export function BackButton({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;
  
  return (
    <button
      onClick={onBack}
      className="absolute top-6 right-6 btn-secondary flex items-center gap-2 text-sm z-10"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>Back</span>
    </button>
  );
}
