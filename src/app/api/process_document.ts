import type { NextApiRequest, NextApiResponse } from "next";
import { processDocumentWithIndustry } from "@/services/documentPipeline";
import { getAllPdfFiles, calculateDocumentHash } from "@/services/bucketScanner";
import { classifyDocument } from "@/services/industryClassifier";
import { getPdfContent } from "@/services/pdfParser";

const BUCKET_NAME = "Documents";
const FOLDER_PATH = ""; // Files are at root of bucket (empty string)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { overwrite } = req.body;

    console.log("🚀 Starting multi-document processing...");
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Folder: ${FOLDER_PATH}`);
    console.log(`   Overwrite mode: ${overwrite ? "ON" : "OFF"}`);
    console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`);

    // Step 1: Get all PDF files from bucket/folder
    console.log(`📂 Calling getAllPdfFiles("${BUCKET_NAME}", "${FOLDER_PATH}")...`);
    const pdfFiles = await getAllPdfFiles(BUCKET_NAME, FOLDER_PATH);
    console.log(`📂 getAllPdfFiles returned: ${pdfFiles.length} files`);
    
    if (pdfFiles.length === 0) {
      console.warn(`⚠️ No PDF files found. Check:
        1. Bucket name is correct: "${BUCKET_NAME}"
        2. Files exist in Supabase Storage
        3. Storage permissions allow listing
        4. Environment variables are set correctly`);
      
      return res.status(200).json({
        success: true,
        message: `No PDF files found in "${BUCKET_NAME}" bucket. Please check bucket name and contents.`,
        processedCount: 0,
        totalFiles: 0,
        documents: [],
        debug: {
          bucketName: BUCKET_NAME,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      });
    }

    console.log(`📄 Found ${pdfFiles.length} PDF files to process`);

    // Step 2: Process each PDF
    const results = [];
    const errors = [];
    let totalChunks = 0;
    const industryCounts: Record<string, number> = {};

    for (const fileName of pdfFiles) {
      try {
        console.log(`\n📝 Processing: ${fileName}`);

        // Full path includes folder
        const fullPath = FOLDER_PATH ? `${FOLDER_PATH}/${fileName}` : fileName;
        console.log(`   Full path: ${fullPath}`);

        // Calculate document hash for duplicate detection
        console.log("   🔐 Calculating document hash...");
        const documentHash = await calculateDocumentHash(BUCKET_NAME, fullPath);

        // Download PDF and get sample text for classification
        console.log("   📥 Downloading for classification...");
        const fullText = await getPdfContent(BUCKET_NAME, fullPath);
        const sampleText = fullText.substring(0, 3000);

        // Classify document industry
        const industry = await classifyDocument(sampleText);
        console.log(`   ✅ Classified as: ${industry}`);

        // Process the document
        console.log(`   ⚙️ Processing document...`);
        const result = await processDocumentWithIndustry(
          BUCKET_NAME,
          fullPath,
          industry,
          documentHash,
          overwrite || false
        );

        if (result.success) {
          totalChunks += result.stats.totalChunks;
          industryCounts[industry] = (industryCounts[industry] || 0) + 1;
          
          results.push({
            fileName,
            industry,
            success: true,
            chunks: result.stats.totalChunks,
          });

          console.log(`   ✅ Successfully processed ${fileName}`);
        } else {
          errors.push({ fileName, error: result.message });
          console.log(`   ⚠️ Skipped ${fileName}: ${result.message}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ fileName, error: errorMessage });
        console.error(`   ❌ Error processing ${fileName}:`, errorMessage);
      }
    }

    // Step 3: Return summary
    const successCount = results.length;
    const industrySummary = Object.entries(industryCounts)
      .map(([industry, count]) => `${industry} (${count})`)
      .join(", ");

    return res.status(200).json({
      success: true,
      message: `Processed ${successCount} of ${pdfFiles.length} documents${industrySummary ? `: ${industrySummary}` : ""}`,
      processedCount: successCount,
      totalFiles: pdfFiles.length,
      totalChunks,
      industries: industryCounts,
      documents: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Process document API error:", errorMessage);

    return res.status(500).json({
      success: false,
      error: errorMessage,
      message: "Failed to process documents",
    });
  }
}
