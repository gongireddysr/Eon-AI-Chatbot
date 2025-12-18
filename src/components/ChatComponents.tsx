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
  return (
    <div className="w-64 border-r overflow-hidden h-screen fixed left-0 top-0" style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      borderColor: "rgba(255, 255, 255, 0.1)",
    }}>
      <div className="p-6 h-full flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">
          {title}
        </h2>
        <div className="overflow-y-auto topics-scrollbar flex-1">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="px-3 py-3 mb-2 text-white rounded-lg text-sm transition-all duration-200 cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              {topic}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  accentColor: string;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${
        message.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`${
          message.sender === "user" ? "max-w-[70%]" : "max-w-[85%]"
        } px-5 py-4 rounded-lg`}
        style={{
          background: message.sender === "user" 
            ? "rgba(255, 255, 255, 0.15)" 
            : "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
        }}
      >
        <div className="whitespace-pre-line leading-7 text-[15px]">
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
      className={`transition-all duration-700 ease-in-out ${
        hasMessages
          ? "fixed bottom-0 right-0 left-64 border-t p-4"
          : "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      }`}
      style={{
        width: hasMessages ? "auto" : "calc(100% - 256px - 4rem)",
        maxWidth: hasMessages ? "none" : "800px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(15px)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className={`${hasMessages ? "max-w-4xl mx-auto" : ""} flex gap-2`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-white rounded-lg focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
        />
        <button
          onClick={onSend}
          className="px-6 py-3 text-white rounded-lg font-medium transition-all duration-200"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
        >
          Send
        </button>
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
    <div className="flex-1 overflow-y-auto p-6 pt-20 pb-32 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-lg">
            {emptyStateText}
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
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
      className="absolute top-6 right-6 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 z-10"
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
      }}
    >
      ← Back
    </button>
  );
}
