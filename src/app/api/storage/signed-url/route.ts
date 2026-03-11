import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/storage/signed-url
 * Generate a signed URL for a private Supabase Storage file.
 * Accepts { bucket: string, path: string }
 * Returns { signedUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing 'url' field." },
        { status: 400 }
      );
    }

    // Extract bucket and path from Supabase public URL
    // Format: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid storage URL format." },
        { status: 400 }
      );
    }

    const [, bucket, path] = match;

    const { data, error } = await getSupabaseAdmin().storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to create signed URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error("Signed URL route error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
