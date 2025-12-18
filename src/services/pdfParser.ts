import { getSupabaseClient } from "@/lib/supabase";

// Supabase Storage configuration
export const BUCKET_NAME = "Documents";
export const FINANCE_PDF = "Bank_Customer_Services_Document.pdf";

/**
 * Downloads a PDF file from Supabase Storage bucket
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file within the bucket
 * @returns Buffer containing the PDF data
 */
export async function downloadPdfFromSupabase(
  bucketName: string,
  filePath: string
): Promise<Buffer> {
  const { data, error } = await getSupabaseClient().storage
    .from(bucketName)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data received from Supabase");
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return buffer;
}

/**
 * Parses a PDF buffer and extracts text content
 * @param pdfBuffer - Buffer containing PDF data
 * @returns Extracted text from the PDF
 */
export async function parsePdfToText(pdfBuffer: Buffer): Promise<string> {
  // Dynamic require inside function to avoid test file loading issue
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse");
  const pdfData = await pdfParse(pdfBuffer);
  return pdfData.text;
}

/**
 * Cleans extracted text by removing extra whitespace and normalizing
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/[^\S\n]+/g, " ")
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, "\n\n")
    // Remove leading/trailing whitespace from each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Remove leading/trailing whitespace from entire text
    .trim();
}

/**
 * Main function: Downloads PDF from Supabase, parses it, and returns clean text
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file within the bucket
 * @returns Clean extracted text ready for chunking
 */
export async function getPdfContent(
  bucketName: string,
  filePath: string
): Promise<string> {
  // Step 1: Download PDF from Supabase
  const pdfBuffer = await downloadPdfFromSupabase(bucketName, filePath);

  // Step 2: Parse PDF to text
  const rawText = await parsePdfToText(pdfBuffer);

  // Step 3: Clean the text
  const cleanedText = cleanText(rawText);

  return cleanedText;
}

/**
 * Convenience function: Gets content from the Finance PDF
 * Uses default bucket "Documents" and file "Bank_Customer_Services_Document.pdf"
 * @returns Clean extracted text ready for chunking
 */
export async function getFinancePdfContent(): Promise<string> {
  return getPdfContent(BUCKET_NAME, FINANCE_PDF);
}
