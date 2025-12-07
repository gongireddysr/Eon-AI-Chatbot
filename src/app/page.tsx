"use client";

import { useState } from "react";

export default function Home() {
  const [testLoading, setTestLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  const testPdfRead = async () => {
    setTestLoading(true);
    try {
      const response = await fetch("/api/test-pdf");
      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Successfully read PDF!\n\nCharacters: ${data.characterCount}\n\nPreview:\n${data.preview}...`
        );
      } else {
        alert(`❌ Failed to read PDF\n\nError: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to read PDF\n\nError: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  const processDocument = async () => {
    setProcessLoading(true);
    try {
      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overwrite }),
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Document Processed Successfully!\n\n` +
          `Document: ${data.documentName}\n` +
          `Text Length: ${data.stats.textLength.toLocaleString()} chars\n` +
          `Total Chunks: ${data.stats.totalChunks}\n` +
          `Avg Chunk Size: ${data.stats.avgChunkSize} chars\n` +
          `Inserted Rows: ${data.stats.insertedRows}\n\n` +
          `${data.message}`
        );
      } else {
        alert(
          `❌ Processing Failed\n\n` +
          `${data.message}\n` +
          `${data.error ? `Error: ${data.error}` : ""}`
        );
      }
    } catch (error) {
      alert(`❌ Failed to process document\n\nError: ${error}`);
    } finally {
      setProcessLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          AI Chatbot - Document Processing
        </h1>
        
        <p className="text-zinc-600 dark:text-zinc-400 text-center">
          Process PDF documents through the complete RAG pipeline: Parse → Chunk → Embed → Store
        </p>

        {/* Process Document Section */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            📄 Process Finance Document
          </h2>
          
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="overwrite" className="text-sm text-zinc-700 dark:text-zinc-300">
              Overwrite existing data (if document already processed)
            </label>
          </div>

          <button
            onClick={processDocument}
            disabled={processLoading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium 
                       hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed
                       transition-colors"
          >
            {processLoading ? "Processing... (This may take a minute)" : "🚀 Process Document"}
          </button>

          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            <p>• Bucket: Documents</p>
            <p>• File: Bank_Customer_Services_Document.pdf</p>
            <p>• Pipeline: Parse → Chunk (1000 chars) → Embed (OpenAI) → Store (Supabase)</p>
          </div>
        </div>

        {/* Test PDF Section */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            🧪 Test PDF Read
          </h2>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Test if the PDF file can be read from Supabase Storage (without processing).
          </p>

          <button
            onClick={testPdfRead}
            disabled={testLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium 
                       hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed
                       transition-colors"
          >
            {testLoading ? "Reading PDF..." : "Test PDF Read"}
          </button>
        </div>
      </main>
    </div>
  );
}
