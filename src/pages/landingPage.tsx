"use client";

import { useState } from "react";
import FinancePage from "./financePage";

export default function LandingPage() {
  const [showFinance, setShowFinance] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");

  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessMessage("Processing document...");

    try {
      console.log("🚀 Starting document processing...");
      
      // Call API route to process document (server-side)
      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overwrite: true }),
      });

      const result = await response.json();

      if (result.success) {
        setProcessMessage(
          `✅ Success! Processed ${result.stats?.totalChunks || 0} chunks from ${result.documentName}`
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
      // Clear message after 5 seconds
      setTimeout(() => setProcessMessage(""), 5000);
    }
  };

  if (showFinance) {
    return <FinancePage onBack={() => setShowFinance(false)} />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-[40%] bg-white rounded-lg shadow-2xl p-12">
        <div className="flex flex-col gap-6 items-center">
          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowFinance(true)}
              className="px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Finance Chat
            </button>
            <button
              onClick={handleProcessDocument}
              disabled={processing}
              className={`px-8 py-4 text-white text-xl font-semibold rounded-lg transition-colors ${
                processing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {processing ? "Processing..." : "Process Document"}
            </button>
          </div>

          {/* Status Message */}
          {processMessage && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm ${
                processMessage.startsWith("✅")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {processMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
