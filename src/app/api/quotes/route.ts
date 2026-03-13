import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/types";

/**
 * GET /api/quotes
 * List quotes paginated, sorted by created_at DESC.
 * Query params:
 *   status — filter by QuoteStatus
 *   search — search customer name or plate_no via joined extraction
 *   page   — page number (default 1)
 *   limit  — page size (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const status = searchParams.get("status") as QuoteStatus | null;
    const search = searchParams.get("search")?.trim() || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Join with extractions to expose vehicle/customer info
    let query = getSupabaseAdmin()
      .from("quotes")
      .select(
        `
        *,
        extractions (
          insured_name,
          plate_no,
          make,
          model_series,
          year_model
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status);
    }

    // Full-text search: filter by insured_name or plate_no on the joined table.
    // Supabase does not support cross-table ILIKE in .or() directly, so we
    // apply a filter on the nested relation using the PostgREST foreign-key
    // column approach.
    if (search) {
      query = query.or(
        `extractions.insured_name.ilike.%${search}%,extractions.plate_no.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("List quotes error:", error);
      return NextResponse.json(
        { error: "Failed to fetch quotes." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data ?? [],
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
    console.error("Quotes GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes
 * Create a new quote record.
 * Required fields: extraction_id
 * Auto-sets: quote_token, expires_at (7 days), status = 'draft'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.extraction_id) {
      return NextResponse.json(
        { error: "extraction_id is required." },
        { status: 400 }
      );
    }

    // Generate a short-ish token (first 12 chars of a UUID, ~48 bits entropy)
    const quote_token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    // Expires 7 days from now
    const expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const record = {
      extraction_id: body.extraction_id,
      quote_token,
      expires_at,
      status: "draft" as QuoteStatus,

      // Vehicle valuation (optional at creation time)
      vehicle_srp: body.vehicle_srp ?? null,
      srp_source: body.srp_source ?? null,
      depreciation_years: body.depreciation_years ?? null,
      depreciation_rate: body.depreciation_rate ?? null,
      fair_market_value: body.fair_market_value ?? null,
      sum_insured: body.sum_insured ?? null,
      sum_insured_override: body.sum_insured_override ?? false,

      // Premium
      premium_rate: body.premium_rate ?? null,
      basic_premium: body.basic_premium ?? null,
      ctpl_premium: body.ctpl_premium ?? null,
      documentary_stamps: body.documentary_stamps ?? null,
      vat: body.vat ?? null,
      local_gov_tax: body.local_gov_tax ?? null,
      total_amount_due: body.total_amount_due ?? null,
      premium_override: body.premium_override ?? false,

      // Policy
      policy_number: body.policy_number ?? null,
      policy_period_from: body.policy_period_from ?? null,
      policy_period_to: body.policy_period_to ?? null,

      // Customer
      customer_email: body.customer_email ?? null,
      customer_phone: body.customer_phone ?? null,
      customer_note: body.customer_note ?? null,

      // Meta
      created_by: body.created_by ?? null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("quotes")
      .insert(record)
      .select("id, created_at, quote_token, status, expires_at")
      .single();

    if (error) {
      console.error("Insert quote error:", error);
      return NextResponse.json(
        { error: "Failed to create quote." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Quotes POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
