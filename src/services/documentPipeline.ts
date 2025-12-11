import { getPdfContent, BUCKET_NAME, FINANCE_PDF } from "./pdfParser";
import { splitTextIntoChunks, getChunkStats } from "./chunker";
import { generateEmbeddingsForChunks } from "./embedding";
import {
  insertChunksToTable,
  documentExists,
  deleteDocumentChunks,
  documentExistsByHash,
} from "./vectorSearch";

export interface PipelineResult {
  success: boolean;
  documentName: string;
  stats: {
    textLength: number;
    totalChunks: number;
    avgChunkSize: number;
    insertedRows: number;
  };
  message: string;
  error?: string;
}

/**
 * Complete pipeline: PDF → Text → Chunks → Embeddings → Database
 * @param bucketName - Supabase storage bucket name
 * @param fileName - PDF file name
 * @param overwrite - If true, deletes existing chunks before inserting
 * @returns Pipeline result with statistics
 */
export async function processDocument(
  bucketName: string,
  fileName: string,
  overwrite: boolean = false
): Promise<PipelineResult> {
  try {
    console.log(`\n🚀 Starting document processing pipeline for: ${fileName}`);

    // Step 1: Check if document already exists
    const exists = await documentExists(fileName);
    if (exists && !overwrite) {
      return {
        success: false,
        documentName: fileName,
        stats: {
          textLength: 0,
          totalChunks: 0,
          avgChunkSize: 0,
          insertedRows: 0,
        },
        message: "Document already processed. Set overwrite=true to reprocess.",
      };
    }

    // Step 2: Delete existing chunks if overwrite is true
    if (exists && overwrite) {
      console.log("🗑️ Deleting existing chunks...");
      await deleteDocumentChunks(fileName);
    }

    // Step 3: Download and parse PDF
    console.log("📄 Downloading and parsing PDF...");
    const text = await getPdfContent(bucketName, fileName);
    console.log(`✅ Extracted ${text.length} characters`);

    // Step 4: Split into chunks
    console.log("✂️ Splitting text into chunks...");
    const chunks = splitTextIntoChunks(text);
    const chunkStats = getChunkStats(chunks);
    console.log(
      `✅ Created ${chunkStats.totalChunks} chunks (avg: ${chunkStats.avgChunkSize} chars)`
    );

    // Step 5: Generate embeddings
    console.log("🧠 Generating embeddings with OpenAI...");
    const chunksWithEmbeddings = await generateEmbeddingsForChunks(chunks);
    console.log(`✅ Generated ${chunksWithEmbeddings.length} embeddings`);

    // Step 6: Insert into database
    console.log("💾 Inserting into database...");
    const insertedRows = await insertChunksToTable(
      chunksWithEmbeddings,
      fileName,
      'Finance'
    );
    console.log(`✅ Inserted ${insertedRows} rows into documents_chat table`);

    return {
      success: true,
      documentName: fileName,
      stats: {
        textLength: text.length,
        totalChunks: chunkStats.totalChunks,
        avgChunkSize: chunkStats.avgChunkSize,
        insertedRows: insertedRows,
      },
      message: "Document processed successfully!",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Pipeline error:", errorMessage);

    return {
      success: false,
      documentName: fileName,
      stats: {
        textLength: 0,
        totalChunks: 0,
        avgChunkSize: 0,
        insertedRows: 0,
      },
      message: "Pipeline failed",
      error: errorMessage,
    };
  }
}

/**
 * Convenience function: Process the Finance PDF
 * Uses default bucket "Documents" and file "Bank_Customer_Services_Document.pdf"
 * @param overwrite - If true, deletes existing chunks before inserting
 * @returns Pipeline result
 */
export async function processFinanceDocument(
  overwrite: boolean = false
): Promise<PipelineResult> {
  return processDocument(BUCKET_NAME, FINANCE_PDF, overwrite);
}

export async function processDocumentWithIndustry(
  bucketName: string,
  fileName: string,
  industry: string,
  documentHash?: string,
  overwrite: boolean = false
): Promise<PipelineResult> {
  try {
    console.log(`\n🚀 Processing ${industry} document: ${fileName}`);

    // Check if document already exists by hash
    if (documentHash && !overwrite) {
      const hashExists = await documentExistsByHash(documentHash);
      if (hashExists) {
        return {
          success: false,
          documentName: fileName,
          stats: {
            textLength: 0,
            totalChunks: 0,
            avgChunkSize: 0,
            insertedRows: 0,
          },
          message: "Document already processed (duplicate detected).",
        };
      }
    }

    // Check if document exists by name
    const exists = await documentExists(fileName, industry);
    if (exists && !overwrite) {
      return {
        success: false,
        documentName: fileName,
        stats: {
          textLength: 0,
          totalChunks: 0,
          avgChunkSize: 0,
          insertedRows: 0,
        },
        message: "Document already processed. Set overwrite=true to reprocess.",
      };
    }

    // Delete existing chunks if overwrite is true
    if (exists && overwrite) {
      console.log("🗑️ Deleting existing chunks...");
      await deleteDocumentChunks(fileName, industry);
    }

    // Download and parse PDF
    console.log("📄 Downloading and parsing PDF...");
    const text = await getPdfContent(bucketName, fileName);
    console.log(`✅ Extracted ${text.length} characters`);

    // Split into chunks
    console.log("✂️ Splitting text into chunks...");
    const chunks = splitTextIntoChunks(text);
    const chunkStats = getChunkStats(chunks);
    console.log(
      `✅ Created ${chunkStats.totalChunks} chunks (avg: ${chunkStats.avgChunkSize} chars)`
    );

    // Generate embeddings
    console.log("🧠 Generating embeddings with OpenAI...");
    const chunksWithEmbeddings = await generateEmbeddingsForChunks(chunks);
    console.log(`✅ Generated ${chunksWithEmbeddings.length} embeddings`);

    // Insert into database with industry label
    console.log(`💾 Inserting into database (${industry})...`);
    const insertedRows = await insertChunksToTable(
      chunksWithEmbeddings,
      fileName,
      industry,
      documentHash
    );
    console.log(`✅ Inserted ${insertedRows} rows into documents_chat table`);

    return {
      success: true,
      documentName: fileName,
      stats: {
        textLength: text.length,
        totalChunks: chunkStats.totalChunks,
        avgChunkSize: chunkStats.avgChunkSize,
        insertedRows: insertedRows,
      },
      message: `${industry} document processed successfully!`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Pipeline error:", errorMessage);

    return {
      success: false,
      documentName: fileName,
      stats: {
        textLength: 0,
        totalChunks: 0,
        avgChunkSize: 0,
        insertedRows: 0,
      },
      message: "Pipeline failed",
      error: errorMessage,
    };
  }
}
