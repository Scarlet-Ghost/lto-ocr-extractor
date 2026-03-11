import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { extractFromDocument } from "@/lib/gemini";

const BUCKET = "orcr-documents";

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}

function extractStoragePath(fileUrl: string): string | null {
  const parts = fileUrl.split(`/storage/v1/object/public/${BUCKET}/`);
  return parts.length >= 2 ? parts[1] : null;
}

async function downloadFile(filePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const { data, error } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file: ${filePath}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: getMimeType(filePath),
  };
}

/**
 * POST /api/extract
 * Accepts { fileUrl: string } for single file
 * or { fileUrls: string[] } for multiple files (OR + CR separately)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, fileUrls } = body as {
      fileUrl?: string;
      fileUrls?: string[];
    };

    // Normalize to array
    const urls: string[] = fileUrls ?? (fileUrl ? [fileUrl] : []);

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Provide 'fileUrl' (single) or 'fileUrls' (array) in request body." },
        { status: 400 }
      );
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 files allowed per extraction." },
        { status: 400 }
      );
    }

    // Download all files
    const documents = await Promise.all(
      urls.map(async (url) => {
        const path = extractStoragePath(url);
        if (!path) {
          throw new Error(`Invalid file URL: ${url}`);
        }
        return downloadFile(path);
      })
    );

    // Send all documents to Gemini for extraction
    const extractionResponse = await extractFromDocument(...documents);

    return NextResponse.json(extractionResponse, { status: 200 });
  } catch (err) {
    console.error("Extract route error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error during extraction.";

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
