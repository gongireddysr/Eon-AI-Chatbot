import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/services/embedding";
import { searchSimilarChunks } from "@/services/vectorSearch";
import { generateRAGResponse } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { message, industry, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Parse conversation history (array of {role, content})
    const conversationHistory = Array.isArray(history) ? history : [];

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
      0.7, // Higher threshold to ensure relevance (0.7 = 70% similarity)
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

    // Step 3: Generate RAG response using OpenAI with conversation history and industry context
    const ragResponse = await generateRAGResponse(message, similarChunks, conversationHistory, selectedIndustry);
    console.log(`✅ Generated RAG response (confidence: ${ragResponse.confidence})`);

    return NextResponse.json({
      success: true,
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      chunksFound: similarChunks.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Chat API error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        answer: "I'm sorry, I encountered an error processing your question. Please try again.",
      },
      { status: 500 }
    );
  }
}
