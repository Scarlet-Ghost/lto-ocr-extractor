import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/vehicle-srps?make=X&model=Y&q=search
 * Search vehicle SRP database.
 * Query params:
 *   make  — filter by make (ILIKE)
 *   model — filter by model (ILIKE)
 *   q     — general search across make, model, variant
 */
export async function GET(request: NextRequest) {
  try {
    const make = request.nextUrl.searchParams.get("make");
    const model = request.nextUrl.searchParams.get("model");
    const q = request.nextUrl.searchParams.get("q");

    let query = getSupabaseAdmin()
      .from("vehicle_srps")
      .select("*")
      .order("make")
      .order("model");

    if (make) {
      query = query.ilike("make", `%${make}%`);
    }
    if (model) {
      query = query.ilike("model", `%${model}%`);
    }
    if (q) {
      query = query.or(
        `make.ilike.%${q}%,model.ilike.%${q}%,variant.ilike.%${q}%`
      );
    }

    query = query.limit(50);

    const { data, error } = await query;

    if (error) {
      console.error("Vehicle SRP search error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Vehicle SRP GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicle-srps
 * Add a new vehicle SRP entry.
 * Required fields: make, model, srp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { make, model, variant, body_type, year_from, year_to, srp, source } =
      body;

    if (!make || !model || srp === undefined || srp === null) {
      return NextResponse.json(
        { error: "make, model, and srp are required." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from("vehicle_srps")
      .insert({
        make,
        model,
        variant: variant || null,
        body_type: body_type || null,
        year_from: year_from || null,
        year_to: year_to || null,
        srp: parseFloat(srp),
        source: source || "manual",
      })
      .select()
      .single();

    if (error) {
      console.error("Vehicle SRP create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Vehicle SRP POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
