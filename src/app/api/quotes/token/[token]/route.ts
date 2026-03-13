import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/quotes/token/[token]
 * Public endpoint — fetches quote by shareable token.
 * Marks quote as "viewed" on first access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const { data, error } = await getSupabaseAdmin()
      .from("quotes")
      .select(`
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
          color
        )
      `)
      .eq("quote_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Auto-expire if not already
      if (data.status !== "expired") {
        await getSupabaseAdmin()
          .from("quotes")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", data.id);
        data.status = "expired";
      }
    }

    // Mark as viewed on first access (only if currently "quoted")
    if (data.status === "quoted" && !data.viewed_at) {
      const now = new Date().toISOString();
      await getSupabaseAdmin()
        .from("quotes")
        .update({ status: "viewed", viewed_at: now, updated_at: now })
        .eq("id", data.id);
      data.status = "viewed";
      data.viewed_at = now;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Quote token GET error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * POST /api/quotes/token/[token]
 * Customer action: approve or reject.
 * Body: { action: "approve" | "reject", customer_note?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action, customer_note } = body as { action: string; customer_note?: string };

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    // Fetch quote
    const { data: quote, error } = await getSupabaseAdmin()
      .from("quotes")
      .select("id, status, expires_at")
      .eq("quote_token", token)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    // Check expiry
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      return NextResponse.json({ error: "This quote has expired." }, { status: 410 });
    }

    // Validate status — can only approve/reject if quoted or viewed
    if (!["quoted", "viewed"].includes(quote.status)) {
      return NextResponse.json(
        { error: `Cannot ${action} a quote with status "${quote.status}".` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      updated_at: now,
    };

    if (action === "approve") {
      update.status = "approved";
      update.approved_at = now;
    } else {
      update.status = "rejected";
      update.customer_note = customer_note || null;
    }

    await getSupabaseAdmin()
      .from("quotes")
      .update(update)
      .eq("id", quote.id);

    return NextResponse.json({ success: true, status: update.status });
  } catch (err) {
    console.error("Quote token POST error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
