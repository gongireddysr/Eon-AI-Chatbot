import type { NextApiRequest, NextApiResponse } from "next";
import { generateEmbedding } from "@/services/embedding";
import { searchSimilarChunks } from "@/services/vectorSearch";
import { generateRAGResponse } from "@/lib/openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, industry } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Default to Finance if no industry specified
    const selectedIndustry = industry || "Finance";
    
    console.log(`💬 User question: ${message}`);
    console.log(`🏢 Industry filter: ${selectedIndustry}`);

    // Step 1: Generate embedding for user's question
    const queryEmbedding = await generateEmbedding(message);
    console.log(`🔢 Generated query embedding (${queryEmbedding.length} dimensions)`);

    // Step 2: Search for similar chunks in vector database filtered by industry
    const similarChunks = await searchSimilarChunks(
      queryEmbedding,
      5, // Get top 5 most relevant chunks
      0.5, // Lower threshold to get more results (0.5 = 50% similarity)
      selectedIndustry // Filter by specified industry
    );
    console.log(`🔍 Found ${similarChunks.length} similar chunks from ${selectedIndustry} industry`);
    
    // Debug: Log chunk details
    if (similarChunks.length > 0) {
      console.log('📄 Top chunk:', {
        similarity: similarChunks[0].similarity,
        document: similarChunks[0].document_name,
        preview: similarChunks[0].content.substring(0, 100) + '...'
      });
    } else {
      console.log('⚠️ No chunks found - check if data exists in documents_chat table');
    }

    // Step 3: Generate RAG response using OpenAI
    const ragResponse = await generateRAGResponse(message, similarChunks);
    console.log(`✅ Generated RAG response (confidence: ${ragResponse.confidence})`);

    return res.status(200).json({
      success: true,
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      chunksFound: similarChunks.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Chat API error:", errorMessage);

    return res.status(500).json({
      success: false,
      error: errorMessage,
      answer: "I'm sorry, I encountered an error processing your question. Please try again.",
    });
  }
}
