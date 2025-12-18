import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Industry = "Finance" | "Education" | "Healthcare";

/**
 * Classifies document content into one of the predefined industries
 * @param sampleText - Sample text from the document (first few paragraphs)
 * @returns Industry classification
 */
export async function classifyDocument(sampleText: string): Promise<Industry> {
  try {
    console.log("🔍 Classifying document industry...");
    
    const prompt = `Analyze the following document excerpt and classify it into ONE of these industries:
- Finance (banking, investments, loans, financial services)
- Education (schools, courses, learning, academic content)
- Healthcare (medical, health services, patient care, hospitals)

Document excerpt:
${sampleText.substring(0, 2000)}

Respond with ONLY ONE WORD: Finance, Education, or Healthcare`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a document classifier. Respond with only one word: Finance, Education, or Healthcare."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const classification = response.choices[0]?.message?.content?.trim() as Industry;
    
    // Validate classification
    const validIndustries: Industry[] = ["Finance", "Education", "Healthcare"];
    if (!validIndustries.includes(classification)) {
      console.warn(`⚠️ Invalid classification: ${classification}, defaulting to Finance`);
      return "Finance";
    }
    
    console.log(`✅ Classified as: ${classification}`);
    return classification;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Classification error: ${errorMessage}`);
    console.log("⚠️ Defaulting to Finance industry");
    return "Finance";
  }
}

/**
 * Gets the table name for a given industry
 * All industries use the same table now: documents_chat
 * @param industry - Industry name
 * @returns Table name
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getTableNameForIndustry(_industry: Industry): string {
  return "documents_chat";
}
