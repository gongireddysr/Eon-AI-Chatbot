import { NextResponse } from "next/server";
import { getPdfContent, BUCKET_NAME, FINANCE_PDF } from "@/services/pdfParser";

export async function GET() {
  try {
    const text = await getPdfContent(BUCKET_NAME, FINANCE_PDF);
    
    // Return first 500 characters as preview
    const preview = text.substring(0, 500);
    
    return NextResponse.json({
      success: true,
      message: "Successfully read PDF",
      characterCount: text.length,
      preview: preview,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to read PDF",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
