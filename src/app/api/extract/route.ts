import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { extractFromDocument } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'fileUrl' in request body." },
        { status: 400 }
      );
    }

    // Extract the storage path from the public URL
    // Public URLs follow: <supabase_url>/storage/v1/object/public/<bucket>/<path>
    const bucketName = "orcr-documents";
    const urlParts = fileUrl.split(`/storage/v1/object/public/${bucketName}/`);
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid file URL. Must be a Supabase Storage public URL." },
        { status: 400 }
      );
    }
    const filePath = urlParts[1];

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
      .from(bucketName)
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Supabase Storage download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file from storage." },
        { status: 500 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine MIME type from file extension
    const ext = filePath.split(".").pop()?.toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "pdf") mimeType = "application/pdf";

    // Send to Gemini for extraction
    const extractionResponse = await extractFromDocument(buffer, mimeType);

    return NextResponse.json(extractionResponse, { status: 200 });
  } catch (err) {
    console.error("Extract route error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error during extraction.";

    // Distinguish Gemini parsing errors from other errors
    if (message.includes("Failed to parse Gemini response")) {
      return NextResponse.json(
        { error: "Gemini returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
