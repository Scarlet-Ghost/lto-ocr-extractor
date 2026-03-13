import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/types";

// Valid status transitions
const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["quoted", "expired", "rejected"],
  quoted: ["viewed", "approved", "expired", "rejected"],
  viewed: ["approved", "expired", "rejected"],
  approved: ["issued", "rejected"],
  issued: [],
  expired: [],
  rejected: [],
};

/**
 * GET /api/quotes/[id]
 * Fetch a single quote by ID, joined with extraction data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing quote ID." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from("quotes")
      .select(
        `
        *,
        extractions (
          insured_name,
          insured_address,
          plate_no,
          conduction_sticker,
          make,
          model_series,
          year_model,
          type_of_body,
          serial_chassis_no,
          motor_no,
          capacity,
          unladen_weight,
          color,
          registration_date,
          original_file_url,
          original_file_type
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Quote not found for id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Quote GET [id] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotes/[id]
 * Update any quote field.
 * If status changes, validates transition.
 * Auto-sets updated_at via Supabase trigger (or handled here as fallback).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    if (!id) {
      return NextResponse.json(
        { error: "Missing quote ID." },
        { status: 400 }
      );
    }

    // Validate status transition if status is being changed
    if (body.status) {
      // Fetch current status
      const { data: current, error: fetchErr } = await getSupabaseAdmin()
        .from("quotes")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchErr || !current) {
        return NextResponse.json(
          { error: `Quote not found for id: ${id}` },
          { status: 404 }
        );
      }

      const currentStatus = current.status as QuoteStatus;
      const nextStatus = body.status as QuoteStatus;
      const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

      if (!allowed.includes(nextStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition: ${currentStatus} → ${nextStatus}. Allowed: ${allowed.join(", ") || "none"}.`,
          },
          { status: 422 }
        );
      }

      // Set timestamp fields for specific transitions
      if (nextStatus === "quoted" && !body.sent_at) {
        body.sent_at = new Date().toISOString();
      }
      if (nextStatus === "viewed" && !body.viewed_at) {
        body.viewed_at = new Date().toISOString();
      }
      if (nextStatus === "approved" && !body.approved_at) {
        body.approved_at = new Date().toISOString();
      }
      if (nextStatus === "issued" && !body.issued_at) {
        body.issued_at = new Date().toISOString();
      }
    }

    // Build update payload from allowed fields
    const allowedFields: string[] = [
      "extraction_id",
      "vehicle_srp",
      "srp_source",
      "depreciation_years",
      "depreciation_rate",
      "fair_market_value",
      "sum_insured",
      "sum_insured_override",
      "premium_rate",
      "basic_premium",
      "ctpl_premium",
      "documentary_stamps",
      "vat",
      "local_gov_tax",
      "total_amount_due",
      "premium_override",
      "policy_number",
      "policy_period_from",
      "policy_period_to",
      "customer_email",
      "customer_phone",
      "customer_note",
      "status",
      "sent_at",
      "viewed_at",
      "approved_at",
      "issued_at",
      "expires_at",
      "created_by",
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

    // Always refresh updated_at (Supabase trigger handles it, but set explicitly
    // as a fallback in case the trigger is not configured)
    updates.updated_at = new Date().toISOString();

    const { data, error } = await getSupabaseAdmin()
      .from("quotes")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Update quote error:", error);
      return NextResponse.json(
        { error: "Failed to update quote." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Quote PATCH [id] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
