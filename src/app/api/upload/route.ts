import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateFile, getFileExtension } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please include a 'file' field." },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = getFileExtension(file.type);
    const uniqueName = `${randomUUID()}.${ext}`;

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await getSupabaseAdmin().storage
      .from("orcr-documents")
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file to storage." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = getSupabaseAdmin().storage
      .from("orcr-documents")
      .getPublicUrl(data.path);

    return NextResponse.json(
      {
        fileUrl: urlData.publicUrl,
        fileType: file.type,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error during file upload." },
      { status: 500 }
    );
  }
}
