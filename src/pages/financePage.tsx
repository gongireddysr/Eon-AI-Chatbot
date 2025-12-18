"use client";

import { useState, useEffect } from "react";
import SpaceBackground from "@/components/SpaceBackground";
import {
  TopicsSidebar,
  FloatingInput,
  ChatMessages,
  BackButton,
  Message,
} from "@/components/ChatComponents";

const STORAGE_KEY = "finance_chat_history";

interface FinancePageProps {
  onBack?: () => void;
}

export default function FinancePage({ onBack }: FinancePageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved messages");
      }
    }
  }, []);

  // Save messages to sessionStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Clear storage when navigating away
  const handleBack = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onBack?.();
  };

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
      // Build conversation history from existing messages (excluding loading messages)
      const history = messages
        .filter((msg) => msg.text !== "Thinking...")
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }));

      // Call RAG API with Finance industry filter and conversation history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userQuestion,
          industry: "Finance",
          history: history,
        }),
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


  const financeTopics = [
    "Account Statements",
    "Savings Account T&Cs",
    "Checking Account Features",
    "ATM/Debit Card Agreement",
    "Wire Transfer & ACH Policy",
    "Personal Loan Agreement",
    "Credit Card Agreement",
    "Mortgage Checklist",
    "Auto Loan Disclosure",
    "Credit Report Guide",
    "Online Banking Security",
    "Fraud Prevention",
    "Mobile Banking Features",
    "Privacy & Data Policy",
    "Digital Wallets Terms",
    "FDIC/NCUA Insurance",
    "Fee Schedule",
    "Complaint Resolution",
    "AML Policy",
    "Power of Attorney Docs",
  ];

  const ACCENT_COLOR = "#00D9FF";

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      <SpaceBackground />
      
      <TopicsSidebar 
        topics={financeTopics} 
        title="Finance Topics" 
        accentColor={ACCENT_COLOR}
      />

      <div className="flex-1 flex flex-col relative ml-64">
        <BackButton onBack={handleBack} />
        
        <ChatMessages 
          messages={messages} 
          accentColor={ACCENT_COLOR}
          emptyStateText="Start a conversation about Finance..."
        />
        
        <FloatingInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          placeholder="Ask about Finance..."
          accentColor={ACCENT_COLOR}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}
