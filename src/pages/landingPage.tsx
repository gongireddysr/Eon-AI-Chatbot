"use client";

import { useState } from "react";
import FinancePage from "./financePage";
import EducationPage from "./educationPage";
import HealthcarePage from "./healthcarePage";
import SpaceBackground from "@/components/SpaceBackground";

export default function LandingPage() {
  const [showFinance, setShowFinance] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showHealthcare, setShowHealthcare] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");

  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessMessage("Processing documents...");

    try {
      console.log("🚀 Starting document processing...");
      
      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overwrite: false }),
      });

      const result = await response.json();

      if (result.success) {
        const industryInfo = result.industries 
          ? Object.entries(result.industries)
              .map(([ind, count]) => `${ind} (${count})`)
              .join(", ")
          : "";
        setProcessMessage(
          `✅ Processed ${result.processedCount} document(s)${industryInfo ? `: ${industryInfo}` : ""}. Total chunks: ${result.totalChunks || 0}`
        );
        console.log("✅ Document processing complete:", result);
      } else {
        setProcessMessage(`❌ Error: ${result.message || result.error}`);
        console.error("❌ Document processing failed:", result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setProcessMessage(`❌ Error: ${errorMessage}`);
      console.error("❌ Document processing error:", error);
    } finally {
      setProcessing(false);
      setTimeout(() => setProcessMessage(""), 8000);
    }
  };

  if (showFinance) {
    return <FinancePage onBack={() => setShowFinance(false)} />;
  }

  if (showEducation) {
    return <EducationPage onBack={() => setShowEducation(false)} />;
  }

  if (showHealthcare) {
    return <HealthcarePage onBack={() => setShowHealthcare(false)} />;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <SpaceBackground />
      
      {/* Process Document Button - Top Right */}
      <button
        onClick={handleProcessDocument}
        disabled={processing}
        className="absolute top-6 right-6 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 z-20 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
        }}
        onMouseEnter={(e) => {
          if (!processing) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
        }}
      >
        {processing ? "Processing..." : "Process Documents"}
      </button>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-16 z-10 px-4">
        {/* Heading */}
        <h1 className="text-7xl font-bold text-white tracking-wider animate-glide-in">
          EON AI CHATBOT
        </h1>

        {/* Industry Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Finance Box */}
          <div
            onClick={() => setShowFinance(true)}
            className="cursor-pointer p-8 rounded-2xl transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-3">
              Finance
            </h2>
            <p className="text-gray-300 text-sm">
              Banking, loans, investments, and financial services
            </p>
          </div>

          {/* Education Box */}
          <div
            onClick={() => setShowEducation(true)}
            className="cursor-pointer p-8 rounded-2xl transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-3">
              Education
            </h2>
            <p className="text-gray-300 text-sm">
              Courses, admissions, scholarships, and academic programs
            </p>
          </div>

          {/* Healthcare Box */}
          <div
            onClick={() => setShowHealthcare(true)}
            className="cursor-pointer p-8 rounded-2xl transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-3">
              Healthcare
            </h2>
            <p className="text-gray-300 text-sm">
              Medical services, appointments, and patient care
            </p>
          </div>
        </div>

        {/* Process Message */}
        {processMessage && (
          <div 
            className="mt-4 p-4 rounded-lg text-center max-w-md animate-glide-in"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
            }}
          >
            {processMessage}
          </div>
        )}
      </div>
    </div>
  );
}
