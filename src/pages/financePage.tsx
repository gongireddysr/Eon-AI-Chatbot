"use client";

import { useState } from "react";

interface FinancePageProps {
  onBack?: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export default function FinancePage({ onBack }: FinancePageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userQuestion = input;
    setInput("");

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: userQuestion,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: "Thinking...",
      sender: "ai",
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call RAG API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userQuestion }),
      });

      const data = await response.json();

      // Remove loading message and add real response
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => msg.id !== loadingMessage.id);
        const aiMessage: Message = {
          id: Date.now() + 2,
          text: data.answer || "I couldn't generate a response.",
          sender: "ai",
        };
        return [...withoutLoading, aiMessage];
      });
    } catch (error) {
      // Remove loading message and show error
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => msg.id !== loadingMessage.id);
        const errorMessage: Message = {
          id: Date.now() + 2,
          text: "Sorry, I encountered an error. Please try again.",
          sender: "ai",
        };
        return [...withoutLoading, errorMessage];
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors z-10"
      >
        ← Back
      </button>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 pt-20 pb-24">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Start a conversation...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`${
                    message.sender === "user" ? "max-w-[70%]" : "max-w-[85%]"
                  } px-5 py-4 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  <div className="whitespace-pre-line leading-7 text-[15px]">
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
