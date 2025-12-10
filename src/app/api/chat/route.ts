import { NextResponse } from "next/server";
import { generateEmbedding } from "@/services/embedding";
import { searchSimilarChunks } from "@/services/vectorSearch";
import { generateRAGResponse } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`💬 User question: ${message}`);

    // Step 1: Generate embedding for user's question
    const queryEmbedding = await generateEmbedding(message);
    console.log(`🔢 Generated query embedding (${queryEmbedding.length} dimensions)`);

    // Step 2: Search for similar chunks in vector database
    const similarChunks = await searchSimilarChunks(
      queryEmbedding,
      5, // Get top 5 most relevant chunks
      0.5 // 50% similarity threshold
    );
    console.log(`🔍 Found ${similarChunks.length} similar chunks`);

    if (similarChunks.length > 0) {
      console.log('📄 Top chunk:', {
        similarity: similarChunks[0].similarity,
        document: similarChunks[0].document_name,
        preview: similarChunks[0].content.substring(0, 100) + '...'
      });
    } else {
      console.log('⚠️ No chunks found - check if data exists in finance_chat table');
    }

    // Step 3: Generate RAG response using OpenAI
    const ragResponse = await generateRAGResponse(message, similarChunks);
    console.log(`✅ Generated RAG response (confidence: ${ragResponse.confidence})`);

    return NextResponse.json({
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Chat error:", errorMessage);

    return NextResponse.json(
      {
        error: errorMessage,
        answer: "Sorry, I encountered an error. Please try again.",
      },
      { status: 500 }
    );
  }
}
