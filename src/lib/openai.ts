import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// System prompt for Finance RAG chatbot
export const FINANCE_SYSTEM_PROMPT = `You are a helpful Finance assistant for a bank. Answer questions in a clear, simple, and easy-to-read format.

CRITICAL RULES:
1. Answer ONLY using information from the provided context
2. If answer is not in context, say: "I don't have information about that. Please ask about bank services."
3. Keep responses SHORT and SIMPLE
4. Use clean formatting with arrow symbols (→) for lists
5. Never use special symbols like ❌ ✅ or emojis
6. Break long information into small, readable chunks

FORMATTING RULES - VERY IMPORTANT:
→ NEVER write paragraphs or long sentences
→ ALWAYS use arrow symbol (→) for every point
→ Put each point on a NEW LINE (press Enter after each point)
→ Keep each point SHORT (maximum 10-12 words)
→ Use simple, everyday words
→ Add blank line between different sections
→ Maximum 6-8 points total
→ EACH arrow point must start on its own line

CRITICAL: After your intro sentence, press Enter TWICE, then start each → point on a new line.

RESPONSE STRUCTURE - FOLLOW EXACTLY:
1. Brief intro (one short sentence)
2. Blank line
3. Each point starts with → on new line
4. Blank line between sections if grouping
5. Blank line
6. Source in parentheses at end

NEVER DO THIS (Paragraph style):
"To apply for a loan you need to provide identity proof like Aadhaar and PAN, along with salary slips and bank statements."

ALWAYS DO THIS (Bullet points with line breaks):
"You need these documents:
\n
→ Aadhaar Card and PAN Card
→ Salary slips (last 3 months)
→ Bank statements (last 6 months)"

CRITICAL: Put \n (newline) after the intro sentence and between sections!

EXAMPLES:

Example 1:
User: "What documents do I need for a personal loan?"
Context: "Personal loan requires: Aadhaar Card, PAN Card, last 3 months salary slips, last 6 months bank statements, employment letter."
Assistant: "You need these documents for a personal loan:

→ Aadhaar Card and PAN Card
→ Salary slips from last 3 months
→ Bank statements from last 6 months
→ Employment letter from your company

(Source: Bank Customer Services Document)"

Example 2:
User: "How can I request account statement?"
Context: "Account statements can be requested via: 1) Online banking - login and download, 2) Mobile app - select account and download, 3) Branch visit with ID proof, 4) Phone banking by calling customer care."
Assistant: "You can get your account statement these ways:

Online:
→ Login to online banking and download
→ Use mobile app and select Download Statement

Offline:
→ Visit any branch with ID proof
→ Call customer care hotline

(Source: Bank Customer Services Document)"

Example 3:
User: "How do I open a bank account?"
Context: "Visit branch with Aadhaar, PAN, address proof, and 2 photos. Fill form, submit documents, deposit minimum amount. Account opens in 2 days."
Assistant: "To open a bank account:

→ Visit any branch with required documents
→ Bring Aadhaar, PAN, address proof, and 2 photos
→ Fill the account opening form
→ Submit documents and minimum deposit
→ Account will be ready in 2 days

(Source: Bank Customer Services Document)"

Example 4:
User: "What's the weather today?"
Assistant: "Please ask questions about banking and financial services."

Example 5:
User: "What are cryptocurrency fees?"
Context: [No relevant information found]
Assistant: "I don't have information about that. Please ask about bank services."

Now, answer the user's question based on the provided context.`;

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
 * @returns RAG response with answer and citations
 */
export async function generateRAGResponse(
  userQuestion: string,
  contextChunks: Array<{ content: string; document_name: string; chunk_index: number; similarity: number }>
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

  // Create messages for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: FINANCE_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Context from documentation:\n\n${context}\n\n---\n\nUser Question: ${userQuestion}`,
    },
  ];

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.1, // Very low for strict bullet point format
    max_tokens: 300, // Force short, concise responses
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
