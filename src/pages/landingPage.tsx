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
  const [showProcessBtn, setShowProcessBtn] = useState(false);

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
      
      {/* Floating + Button at Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Process Document Button - appears when + is clicked */}
        <button
          onClick={handleProcessDocument}
          disabled={processing}
          className={`btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
            showProcessBtn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {processing ? "Processing..." : "Process Documents"}
        </button>
        
        {/* + Toggle Button */}
        <button
          onClick={() => setShowProcessBtn(!showProcessBtn)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          <svg 
            className={`w-6 h-6 transition-transform duration-300 ${showProcessBtn ? "rotate-45" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12 md:gap-16 z-10 px-4 w-full max-w-6xl">
        {/* Heading with gradient and lens flare */}
        <div className="animate-glide-in text-center relative">
          {/* Horizontal Lens Flare */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 blur-[1px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[20px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-xl" />
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight relative z-10">
            <span className="font-extrabold gradient-title">EON AI</span>
            <span className="font-light text-white/90 ml-2 md:ml-4">CHATBOT</span>
          </h1>
          <p className="mt-4 text-gray-400 text-base md:text-lg font-light tracking-wide">
            Intelligent assistance across industries
          </p>
        </div>

        {/* Industry Boxes with Neon Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
          {/* Finance Box - Cobalt Blue */}
          <div
            onClick={() => setShowFinance(true)}
            className="glass-card neon-card-cobalt cursor-pointer p-6 md:p-8 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0047AB]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#0047AB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white group-hover:text-[#4A90D9] transition-colors duration-300">
                Finance
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Banking, loans, investments, and financial services
            </p>
          </div>

          {/* Education Box - Royal Blue */}
          <div
            onClick={() => setShowEducation(true)}
            className="glass-card neon-card-royal cursor-pointer p-6 md:p-8 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#4169E1]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4169E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white group-hover:text-[#4169E1] transition-colors duration-300">
                Education
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Courses, admissions, scholarships, and academic programs
            </p>
          </div>

          {/* Healthcare Box - Emerald Green */}
          <div
            onClick={() => setShowHealthcare(true)}
            className="glass-card neon-card-emerald cursor-pointer p-6 md:p-8 group sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#50C878]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#50C878]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white group-hover:text-[#50C878] transition-colors duration-300">
                Healthcare
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Medical services, appointments, and patient care
            </p>
          </div>
        </div>

        {/* Process Message */}
        {processMessage && (
          <div className="glass-card mt-4 p-4 text-center max-w-md animate-glide-in text-white">
            {processMessage}
          </div>
        )}
      </div>
    </div>
  );
}
