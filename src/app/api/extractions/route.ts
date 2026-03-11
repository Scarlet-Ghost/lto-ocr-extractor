import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/extractions
 * List extractions paginated, sorted by created_at DESC.
 * Query params: ?page=1&limit=20&search=
 * Search filters by insured_name or plate_no (case-insensitive ILIKE).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = getSupabaseAdmin()
      .from("extractions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `insured_name.ilike.%${search}%,plate_no.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("List extractions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch extractions." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: count ? Math.ceil(count / limit) : 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Extractions GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extractions
 * Insert a new extraction record.
 * Accepts full extraction data in the request body.
 * Returns { id, created_at }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["insured_name", "insured_address", "make", "model_series", "serial_chassis_no", "motor_no"];
    const missing = requiredFields.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Build the record to insert
    const record = {
      original_file_url: body.original_file_url || "",
      original_file_type: body.original_file_type || "",
      insured_name: body.insured_name,
      insured_address: body.insured_address,
      mv_file_no: body.mv_file_no || null,
      plate_no: body.plate_no || null,
      conduction_sticker: body.conduction_sticker || null,
      make: body.make,
      model_series: body.model_series,
      year_model: body.year_model || null,
      type_of_body: body.type_of_body || null,
      serial_chassis_no: body.serial_chassis_no,
      motor_no: body.motor_no,
      capacity: body.capacity || null,
      unladen_weight: body.unladen_weight || null,
      color: body.color || null,
      registration_date: body.registration_date || null,
      confidence_scores: body.confidence_scores || {},
      audit_flags: body.audit_flags || {},
      pdf_url: body.pdf_url || null,
      status: body.status || "draft",
    };

    const { data, error } = await getSupabaseAdmin()
      .from("extractions")
      .insert(record)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Insert extraction error:", error);
      return NextResponse.json(
        { error: "Failed to create extraction record." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: data.id, created_at: data.created_at },
      { status: 201 }
    );
  } catch (err) {
    console.error("Extractions POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
