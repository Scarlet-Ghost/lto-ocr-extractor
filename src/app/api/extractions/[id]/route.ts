import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/extractions/[id]
 * Fetch a single extraction by ID. Returns full record or 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing extraction ID." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from("extractions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Extraction not found for id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Extraction GET [id] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/extractions/[id]
 * Update an extraction record (e.g., after user edits fields).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing extraction ID." },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedFields = [
      "insured_name", "insured_address", "mv_file_no", "plate_no",
      "conduction_sticker", "make", "model_series", "year_model",
      "type_of_body", "serial_chassis_no", "motor_no", "capacity",
      "unladen_weight", "color", "registration_date",
      "confidence_scores", "audit_flags", "pdf_url", "status",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from("extractions")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Update extraction error:", error);
      return NextResponse.json(
        { error: "Failed to update extraction." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Extraction PATCH [id] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
