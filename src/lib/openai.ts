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

// Question types for AI classification
type QuestionType = "social" | "on_topic" | "follow_up" | "off_topic" | "topics_inquiry";

// Industry-specific topic definitions (synced with page sidebar topics)
const INDUSTRY_SCOPE: Record<string, string> = {
  Finance: "Account Statements, Savings Account, Checking Account, ATM/Debit Card, Wire Transfer, ACH, Personal Loan, Credit Card, Mortgage, Auto Loan, Credit Report, Online Banking Security, Fraud Prevention, Mobile Banking, Privacy Policy, Digital Wallets, FDIC/NCUA Insurance, Fee Schedule, Complaint Resolution, AML Policy, Power of Attorney",
  Education: "Student Enrollment, Registration, Course Creation, Curriculum, Class Scheduling, Timetable, Attendance Tracking, Grade Submission, Evaluation, Student Profile, Teacher Onboarding, Classroom Resource Booking, Assignment Submission, Online Exams, Proctoring, Feedback, Course Evaluation, Fee Payments, Invoices, Parent-Teacher Communication, Student Progress Reports, Login Issues, Account Issues, LTI/SSO Integration, Data Backup, User Roles, Permissions, Dropouts, Withdrawals, Notifications, Alerts",
  Healthcare: "Patient Registration, Intake Workflow, Electronic Health Record, EHR, Medication Ordering, Administration Procedure, Diagnostic Test, Emergency Room Triage, Patient Consent, Appointment Scheduling, Inpatient Admission, Bed Allocation, Clinical Documentation, Critical Lab Values, Discharge Planning, Patient Transfer, Medical Device Usage, Insurance Claim Submission, Pre-Authorization, Infection Control, Isolation Room, Telemedicine, Prescription Refill, Code Blue, Patient Follow-Up, Care Continuity, Incident Reporting, Risk Management",
};

// AI-powered question classifier - the chatbot's "brain" to understand questions
async function classifyQuestion(
  message: string,
  hasConversationHistory: boolean,
  currentIndustry: string
): Promise<QuestionType> {
  const industryScope = INDUSTRY_SCOPE[currentIndustry] || INDUSTRY_SCOPE["Finance"];
  
  const classifierPrompt = `You are a question classifier for a ${currentIndustry} chatbot. Classify the user's message into ONE of these categories:

CATEGORIES:
- "social": Greetings, thanks, goodbyes, casual chat (hi, hello, thanks, bye, how are you)
- "topics_inquiry": Questions asking what topics/subjects are available, what you can help with, what you know about
- "follow_up": Short follow-up to a previous topic (why?, how?, tell me more) - ONLY if there's conversation history AND it's still about ${currentIndustry}
- "on_topic": Questions specifically about ${currentIndustry} topics: ${industryScope}
- "off_topic": Questions about OTHER industries or unrelated topics

IMPORTANT - INDUSTRY BOUNDARIES:
- You are ONLY helping with ${currentIndustry}.
- If someone asks about auto insurance or home insurance in a Healthcare chat → "off_topic" (those belong to Finance)
- If someone asks about health insurance in a Finance chat → "off_topic" (that belongs to Healthcare)
- If someone asks about student loans in Healthcare → "off_topic" (that belongs to Finance/Education)
- Only classify as "on_topic" if the question is SPECIFICALLY about ${currentIndustry}.

RULES:
- Greeting or casual chat → "social"
- Asking what topics are available → "topics_inquiry"
- Short follow-up about ${currentIndustry} AND has history → "follow_up"
- Specifically about ${currentIndustry} → "on_topic"
- About other industries or unrelated → "off_topic"

Has conversation history: ${hasConversationHistory ? "YES" : "NO"}

Respond with ONLY the category name, nothing else.`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: classifierPrompt },
      { role: "user", content: message }
    ],
    temperature: 0,
    max_tokens: 20,
  });

  const result = completion.choices[0]?.message?.content?.trim().toLowerCase() || "off_topic";
  
  // Map response to valid type
  if (result.includes("social")) return "social";
  if (result.includes("topics_inquiry") || result.includes("topics inquiry")) return "topics_inquiry";
  if (result.includes("follow_up") || result.includes("follow-up")) return "follow_up";
  if (result.includes("on_topic") || result.includes("on-topic")) return "on_topic";
  return "off_topic";
}

// Predefined topics for each industry (matching the sidebar topics exactly)
const INDUSTRY_TOPICS: Record<string, string[]> = {
  Finance: [
    "Account Statements",
    "Savings Account T&Cs",
    "Checking Account Features",
    "ATM/Debit Card Agreement",
    "Wire Transfer & ACH Policy",
    "Personal Loan Agreement",
    "Credit Card Agreement",
    "Mortgage Checklist",
    "Auto Loan Disclosure",
    "Credit Report Guide",
    "Online Banking Security",
    "Fraud Prevention",
    "Mobile Banking Features",
    "Privacy & Data Policy",
    "Digital Wallets Terms",
    "FDIC/NCUA Insurance",
    "Fee Schedule",
    "Complaint Resolution",
    "AML Policy",
    "Power of Attorney Docs",
  ],
  Education: [
    "Student Enrollment & Registration",
    "Course Creation & Curriculum",
    "Class Scheduling & Timetable",
    "Attendance Tracking",
    "Grade Submission & Evaluation",
    "Student Profile Updates",
    "Teacher Onboarding & Access",
    "Classroom Resource Booking",
    "Assignment Submission Flow",
    "Online Exams & Proctoring",
    "Feedback & Course Evaluation",
    "Fee Payments & Invoices",
    "Parent-Teacher Communication",
    "Student Progress Reports",
    "Login & Account Issues",
    "External Tool Integration (LTI/SSO)",
    "Data Backup & Restoration",
    "User Roles & Permissions",
    "Dropouts & Withdrawals",
    "Notifications & Alerts",
  ],
  Healthcare: [
    "Patient Registration and Initial Intake Workflow",
    "Electronic Health Record (EHR) Data Entry Process",
    "Medication Ordering and Administration Procedure",
    "Diagnostic Test Request and Result Interpretation Flow",
    "Emergency Room Triage and Prioritization Protocol",
    "Patient Consent Collection and Verification",
    "Appointment Scheduling and Rescheduling Workflow",
    "Inpatient Admission and Bed Allocation Process",
    "Clinical Documentation Standards for Providers",
    "Handling Critical Lab Values and Alert Notifications",
    "Discharge Planning and Summary Preparation",
    "Patient Transfer Between Departments Workflow",
    "Medical Device Usage and Maintenance Procedure",
    "Insurance Claim Submission and Pre-Authorization",
    "Infection Control and Isolation Room Protocol",
    "Telemedicine Visit Setup and Documentation",
    "Prescription Refill and Renewal Workflow",
    "Code Blue Activation and Response Procedure",
    "Patient Follow-Up and Care Continuity Tracking",
    "Incident Reporting and Risk Management Process",
  ],
};

// Get sample topics for a specific industry
function getTopicExamples(industry: string): string[] {
  const topics = INDUSTRY_TOPICS[industry] || INDUSTRY_TOPICS["Finance"];
  // Return 3 random topics for variety
  const shuffled = [...topics].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
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
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  industry: string = "Finance"
): Promise<RAGResponse> {
  const hasContext = contextChunks.length > 0;
  const hasHistory = conversationHistory.length > 0;

  // Step 1: AI classifies the question to understand intent (industry-aware)
  const questionType = await classifyQuestion(userQuestion, hasHistory, industry);
  console.log(`🧠 Question classified as: ${questionType} (Industry: ${industry})`);

  // Step 2: Route based on classification
  if (questionType === "off_topic") {
    const industryExamples: Record<string, string> = {
      Finance: "Account Statements, Savings/Checking Accounts, Loans, Credit Cards, Mortgages, Online Banking Security, or Fee Schedules",
      Education: "Student Enrollment, Course Registration, Grade Submission, Attendance Tracking, Fee Payments, or Parent-Teacher Communication",
      Healthcare: "Patient Registration, EHR Data Entry, Appointment Scheduling, Prescription Refills, Insurance Claims, or Telemedicine",
    };
    const examples = industryExamples[industry] || industryExamples["Finance"];
    
    return {
      answer: `That topic is outside what I can help with here. In this ${industry} chat, I can help you with topics like ${examples}. What would you like to know?`,
      sources: [],
      confidence: "low",
    };
  }

  // Handle topics inquiry - show what topics are available
  if (questionType === "topics_inquiry") {
    const topicExamples = getTopicExamples(industry);
    const topicList = topicExamples.length > 0
      ? topicExamples.map(t => `• ${t}`).join("\n")
      : "various topics";
    
    const answer = topicExamples.length > 0
      ? `I can help you with ${industry} topics! Here are some things I know about:\n\n${topicList}\n\nFeel free to ask me about any of these, or anything else related to ${industry}!`
      : `I can help you with ${industry} topics like accounts, loans, insurance, and more. What would you like to know?`;
    
    return {
      answer,
      sources: [],
      confidence: "high",
    };
  }

  // Step 3: For on-topic questions without context, let AI know it doesn't have specific docs
  const context = hasContext
    ? contextChunks
        .map((chunk, idx) => 
          `[Context ${idx + 1}] (Similarity: ${(chunk.similarity * 100).toFixed(1)}%, Document: ${chunk.document_name}, Chunk: ${chunk.chunk_index})\n${chunk.content}`
        )
        .join("\n\n---\n\n")
    : "";

  // Build messages for OpenAI
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

  // Build user message based on question type and available context
  let userContent: string;
  if (questionType === "social") {
    userContent = userQuestion;
  } else if (questionType === "follow_up" && hasHistory) {
    userContent = hasContext
      ? `Context from documentation:\n\n${context}\n\n---\n\nFollow-up question: ${userQuestion}`
      : `Follow-up question (no new documentation context, use conversation history): ${userQuestion}`;
  } else if (hasContext) {
    userContent = `Context from documentation:\n\n${context}\n\n---\n\nUser Question: ${userQuestion}`;
  } else {
    userContent = `User is asking about a topic in your domain (Finance/Education/Healthcare), but I don't have specific documentation on this. Please help based on your knowledge or let them know you don't have specific details.\n\nUser Question: ${userQuestion}`;
  }
  
  messages.push({
    role: "user",
    content: userContent,
  });

  // Call OpenAI
  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.3,
    max_tokens: 400,
    top_p: 0.9,
  });

  const rawAnswer = completion.choices[0]?.message?.content || "I couldn't generate a response.";
  
  // Strip markdown formatting from the response
  const answer = rawAnswer
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
    .replace(/__(.*?)__/g, '$1')      // Remove __bold__
    .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
    .replace(/_(.*?)_/g, '$1')        // Remove _italic_
    .replace(/^#{1,6}\s*/gm, '')      // Remove # headers
    .replace(/^[-*]\s+/gm, '')        // Remove - or * bullet points
    .replace(/`([^`]+)`/g, '$1')      // Remove `code`
    .replace(/```[\s\S]*?```/g, '')   // Remove code blocks
    .trim();

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
