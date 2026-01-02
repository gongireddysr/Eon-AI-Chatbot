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
import { SessionRatingModal } from "@/components/FeedbackComponents";

const STORAGE_KEY = "healthcare_chat_history";

interface HealthcarePageProps {
  onBack?: () => void;
}

export default function HealthcarePage({ onBack }: HealthcarePageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => `healthcare-${Date.now()}`);
  const [showRating, setShowRating] = useState(false);

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
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

  // Handle back button - show rating modal if there are messages
  const handleBackClick = () => {
    if (messages.length > 0) {
      setShowRating(true);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      onBack?.();
    }
  };

  // Complete navigation after rating
  const completeBack = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setShowRating(false);
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

      // Call RAG API with Healthcare industry filter and conversation history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userQuestion,
          industry: "Healthcare",
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
    } catch {
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
    "Patient Registration and Initial Intake Workflow",
    "Electronic Health Record (EHR) Data Entry Process",
    "Medication Ordering and Administration Procedure",
    "Diagnostic Test Request and Result Interpretation Flow",
    "Emergency Room Triage and Prioritization Protocol",
    "Patient Consent Collection and Verification",
    "Appointment Scheduling and Rescheduling Workflow",
    "Inpatient Admission and Bed Allocation Process",
    "Clinical Documentation Standards for Providers",
    "Handling Critical Lab Values and Alert Notifications",
    "Discharge Planning and Summary Preparation",
    "Patient Transfer Between Departments Workflow",
    "Medical Device Usage and Maintenance Procedure",
    "Insurance Claim Submission and Pre-Authorization",
    "Infection Control and Isolation Room Protocol",
    "Telemedicine Visit Setup and Documentation",
    "Prescription Refill and Renewal Workflow",
    "Code Blue Activation and Response Procedure",
    "Patient Follow-Up and Care Continuity Tracking",
    "Incident Reporting and Risk Management Process",
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
        <BackButton onBack={handleBackClick} />
        
        <ChatMessages 
          messages={messages} 
          accentColor={ACCENT_COLOR}
          emptyStateText="Start a conversation about Healthcare..."
          sessionId={sessionId}
          industry="Healthcare"
        />
        
        {showRating && (
          <SessionRatingModal
            sessionId={sessionId}
            industry="Healthcare"
            onComplete={completeBack}
            onSkip={completeBack}
          />
        )}
        
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
