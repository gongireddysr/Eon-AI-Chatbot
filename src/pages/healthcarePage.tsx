"use client";

import { useState } from "react";
import SpaceBackground from "@/components/SpaceBackground";
import {
  TopicsSidebar,
  FloatingInput,
  ChatMessages,
  BackButton,
  Message,
} from "@/components/ChatComponents";

interface HealthcarePageProps {
  onBack?: () => void;
}

export default function HealthcarePage({ onBack }: HealthcarePageProps) {
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
      // Call RAG API with Healthcare industry filter
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userQuestion,
          industry: "Healthcare"
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


  const healthcareTopics = [
    "Appointments",
    "Medical Records",
    "Health Insurance",
    "Patient Portal",
    "Prescriptions",
    "Lab Results",
    "Specialist Referrals",
    "Emergency Services",
    "Vaccination Records",
    "Billing & Payments",
    "Telemedicine",
    "Hospital Facilities",
    "Medical Procedures",
    "Patient Care",
    "Health Programs",
  ];

  const ACCENT_COLOR = "#FF10F0";

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      <SpaceBackground />
      
      <TopicsSidebar 
        topics={healthcareTopics} 
        title="Healthcare Topics" 
        accentColor={ACCENT_COLOR}
      />

      <div className="flex-1 flex flex-col relative">
        <BackButton onBack={onBack} />
        
        <ChatMessages 
          messages={messages} 
          accentColor={ACCENT_COLOR}
          emptyStateText="Start a conversation about Healthcare..."
        />
        
        <FloatingInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          placeholder="Ask about Healthcare..."
          accentColor={ACCENT_COLOR}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}
