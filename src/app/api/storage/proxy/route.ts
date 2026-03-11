import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/storage/proxy?url=<supabase_storage_url>
 * Proxies a private Supabase Storage file through our server.
 * Avoids CORS issues when loading files client-side (e.g. pdf.js).
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing 'url' param." }, { status: 400 });
    }

    // Extract bucket and path from Supabase storage URL
    // Supports both public and signed URL formats:
    //   /storage/v1/object/public/<bucket>/<path>
    //   /storage/v1/object/sign/<bucket>/<path>?token=...
    // Also supports bare paths like: <bucket>/<path>
    let bucket: string;
    let path: string;

    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
    if (match) {
      bucket = match[1];
      path = match[2];
    } else {
      // Try treating the whole URL as bucket/path (strip leading slash and query params)
      const stripped = url.replace(/^\//, "");
      const slashIdx = stripped.indexOf("/");
      if (slashIdx === -1) {
        return NextResponse.json({ error: "Invalid storage URL." }, { status: 400 });
      }
      bucket = stripped.substring(0, slashIdx);
      path = stripped.substring(slashIdx + 1).split("?")[0];
    }

    const { data, error } = await getSupabaseAdmin().storage
      .from(bucket)
      .download(path);

    if (error || !data) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();

    // Determine content type from the clean path (no query params)
    const ext = path.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Storage proxy error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
