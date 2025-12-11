"use client";

import { useState } from "react";
import FinancePage from "./financePage";
import EducationPage from "./educationPage";
import HealthcarePage from "./healthcarePage";

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
              .map(([ind, count]: [string, any]) => `${ind} (${count})`)
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-[60%] bg-white rounded-lg shadow-2xl p-12">
        <div className="flex flex-col gap-6 items-center">
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => setShowFinance(true)}
              className="px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Finance Chat
            </button>
            <button
              onClick={() => setShowEducation(true)}
              className="px-8 py-4 bg-green-600 text-white text-xl font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Education Chat
            </button>
            <button
              onClick={() => setShowHealthcare(true)}
              className="px-8 py-4 bg-red-600 text-white text-xl font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Healthcare Chat
            </button>
            <button
              onClick={handleProcessDocument}
              disabled={processing}
              className="px-8 py-4 bg-purple-600 text-white text-xl font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Process Documents"}
            </button>
          </div>
          
          {processMessage && (
            <div className={`mt-4 p-4 rounded-lg text-center max-w-md ${
              processMessage.startsWith("✅") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {processMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
