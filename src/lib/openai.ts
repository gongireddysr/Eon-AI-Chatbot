import OpenAI from "openai";

import { BRAIN_PROMPT } from "./prompts/brain";
import { SCOPE_PROMPT } from "./prompts/scope";
import { GROUNDING_PROMPT } from "./prompts/grounding";
import { AMBIGUITY_PROMPT } from "./prompts/ambiguity";
import { SESSION_PROMPT } from "./prompts/session";
import { FORMATTING_PROMPT } from "./prompts/formatting";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// System prompt for Multi-Industry RAG chatbot (Finance, Education, Healthcare)
export const FINANCE_SYSTEM_PROMPT = [
  BRAIN_PROMPT,
  SCOPE_PROMPT,
  GROUNDING_PROMPT,
  AMBIGUITY_PROMPT,
  SESSION_PROMPT,
  FORMATTING_PROMPT,
].join("\n\n---\n\n");

// Interface for RAG response
export interface RAGResponse {
  answer: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Generate RAG response using OpenAI with retrieved context
 * @param userQuestion - The user's question
 * @param contextChunks - Retrieved relevant chunks from vector database
 * @param conversationHistory - Previous messages in the conversation
 * @returns RAG response with answer and citations
 */
export async function generateRAGResponse(
  userQuestion: string,
  contextChunks: Array<{ content: string; document_name: string; chunk_index: number; similarity: number }>,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<RAGResponse> {
  // Build context from chunks
  const context = contextChunks
    .map((chunk, idx) => 
      `[Context ${idx + 1}] (Similarity: ${(chunk.similarity * 100).toFixed(1)}%, Document: ${chunk.document_name}, Chunk: ${chunk.chunk_index})\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  // If no context found, return early
  if (contextChunks.length === 0) {
    return {
      answer: "I don't have information about that in the current documentation. Please ask a question related to bank customer services.",
      sources: [],
      confidence: "low",
    };
  }

  // Create messages for OpenAI with conversation history
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: FINANCE_SYSTEM_PROMPT,
    },
  ];

  // Add conversation history (limit to last 6 messages to save tokens)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current user question with context
  messages.push({
    role: "user",
    content: `Context from documentation:\n\n${context}\n\n---\n\nUser Question: ${userQuestion}`,
  });

  // Call OpenAI
  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.3, // Balanced for clear, concise explanations
    max_tokens: 200, // Short but meaningful responses
    top_p: 0.9,
  });

  const answer = completion.choices[0]?.message?.content || "I couldn't generate a response.";

  // Extract sources from context chunks
  const sources = contextChunks.map(
    (chunk) => `${chunk.document_name} (Chunk ${chunk.chunk_index}, Similarity: ${(chunk.similarity * 100).toFixed(1)}%)`
  );

  // Determine confidence based on similarity scores
  const avgSimilarity = contextChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / contextChunks.length;
  const confidence: "high" | "medium" | "low" = 
    avgSimilarity > 0.8 ? "high" : avgSimilarity > 0.6 ? "medium" : "low";

  return {
    answer,
    sources,
    confidence,
  };
}
