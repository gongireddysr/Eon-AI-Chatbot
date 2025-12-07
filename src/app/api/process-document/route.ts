import { NextResponse } from "next/server";
import { processFinanceDocument } from "@/services/documentPipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const overwrite = body.overwrite || false;

    /* console.log(`Processing Finance document (overwrite: ${overwrite})`); */

    const result = await processFinanceDocument(overwrite);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("API error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process document",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
