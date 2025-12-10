import { NextResponse } from "next/server";
import { processFinanceDocument } from "@/services/documentPipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { overwrite } = body;

    console.log("🚀 Starting document processing...");
    console.log(`   Overwrite mode: ${overwrite ? "ON" : "OFF"}`);

    // Process the Finance PDF from Supabase Storage
    const result = await processFinanceDocument(overwrite || false);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      documentName: result.documentName,
      stats: result.stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Process document API error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: "Failed to process document",
      },
      { status: 500 }
    );
  }
}
