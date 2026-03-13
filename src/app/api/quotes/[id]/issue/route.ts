import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generatePolicyPdf } from "@/lib/pdf-generator";
import type { ExtractionData } from "@/lib/types";

/**
 * Generate policy number: VSO-{YYYY}-{NNNNN}
 * Sequential within the calendar year based on count of issued quotes.
 */
async function generatePolicyNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const { count } = await getSupabaseAdmin()
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("status", "issued")
    .gte("issued_at", `${year}-01-01T00:00:00Z`);

  const seq = String((count ?? 0) + 1).padStart(5, "0");
  return `VSO-${year}-${seq}`;
}

/**
 * Format a Date to MM/DD/YYYY string.
 */
function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * POST /api/quotes/[id]/issue
 *
 * Transitions an approved quote to "issued":
 * 1. Validates quote exists and is "approved"
 * 2. Generates a sequential policy number (VSO-YYYY-NNNNN)
 * 3. Computes policy period (today → today + 1 year)
 * 4. Fetches linked extraction data for vehicle/insured fields
 * 5. Generates a filled Annex-C PDF with all vehicle + premium fields
 * 6. Uploads PDF to Supabase Storage bucket "generated-pdfs"
 * 7. Updates quote: status="issued", issued_at, policy_number, pdf_url
 * 8. Returns { policy_number, pdf_url, status: "issued" }
 */
export async function POST(
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

    const supabase = getSupabaseAdmin();

    // 1. Fetch the quote with its linked extraction
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .select(
        `
        *,
        extractions (
          insured_name,
          insured_address,
          mv_file_no,
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

    if (quoteErr || !quote) {
      return NextResponse.json(
        { error: `Quote not found for id: ${id}` },
        { status: 404 }
      );
    }

    // 2. Validate status — must be "approved"
    if (quote.status !== "approved") {
      return NextResponse.json(
        {
          error: `Quote cannot be issued. Current status is "${quote.status}". Status must be "approved".`,
          current_status: quote.status,
        },
        { status: 409 }
      );
    }

    // 3. Generate policy number and policy period
    const policyNumber = await generatePolicyNumber();
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const periodFrom = today.toISOString().split("T")[0]; // YYYY-MM-DD for DB
    const periodTo = oneYearLater.toISOString().split("T")[0];

    // 4. Build extraction data for PDF generation
    const ext = quote.extractions as ExtractionData | null;
    if (!ext) {
      return NextResponse.json(
        { error: "Quote has no linked extraction data." },
        { status: 422 }
      );
    }

    // 5. Generate PDF with all vehicle + premium/policy fields
    const pdfBytes = await generatePolicyPdf(ext, {
      policy_number: policyNumber,
      date_issued: formatDate(today),
      period_from: formatDate(today),
      period_to: formatDate(oneYearLater),
      premium_paid: quote.total_amount_due ?? 0,
      sum_insured: quote.sum_insured ?? 100000,
    });

    // 6. Upload PDF to Supabase Storage
    const fileName = `policy-${policyNumber}-${id}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("generated-pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("PDF upload error:", uploadErr);
      return NextResponse.json(
        { error: "Failed to upload generated PDF." },
        { status: 500 }
      );
    }

    // Construct the public/signed URL
    const { data: urlData } = supabase.storage
      .from("generated-pdfs")
      .getPublicUrl(fileName);
    const pdfUrl = urlData?.publicUrl ?? null;

    // 7. Update the quote record
    const issuedAt = today.toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from("quotes")
      .update({
        status: "issued",
        issued_at: issuedAt,
        policy_number: policyNumber,
        policy_period_from: periodFrom,
        policy_period_to: periodTo,
        pdf_url: pdfUrl,
        updated_at: issuedAt,
      })
      .eq("id", id)
      .select("status, policy_number, policy_period_from, policy_period_to, pdf_url, issued_at")
      .single();

    if (updateErr) {
      console.error("Quote update error:", updateErr);
      return NextResponse.json(
        { error: "PDF generated but failed to update quote record." },
        { status: 500 }
      );
    }

    // 8. Return success payload
    return NextResponse.json(
      {
        policy_number: policyNumber,
        pdf_url: pdfUrl,
        status: "issued",
        policy_period_from: periodFrom,
        policy_period_to: periodTo,
        issued_at: issuedAt,
        quote: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Issue policy error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
