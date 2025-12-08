"use client";

import { useState } from "react";
import FinancePage from "./financePage";

export default function LandingPage() {
  const [showFinance, setShowFinance] = useState(false);

  if (showFinance) {
    return <FinancePage onBack={() => setShowFinance(false)} />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-[35%] bg-white rounded-lg shadow-2xl p-12 flex items-center justify-center">
        <button
          onClick={() => setShowFinance(true)}
          className="px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finance Chat
        </button>
      </div>
    </div>
  );
}
