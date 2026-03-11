import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateAnnexCPdf } from "@/lib/pdf-generator";
import { ExtractionData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractionId, extractedData } = body as {
      extractionId?: string;
      extractedData?: ExtractionData;
    };

    if (!extractionId && !extractedData) {
      return NextResponse.json(
        { error: "Provide either 'extractionId' or 'extractedData' in the request body." },
        { status: 400 }
      );
    }

    let data: ExtractionData;

    if (extractionId) {
      // Fetch extraction data from Supabase
      const { data: record, error: fetchError } = await getSupabaseAdmin()
        .from("extractions")
        .select("*")
        .eq("id", extractionId)
        .single();

      if (fetchError || !record) {
        console.error("Fetch extraction error:", fetchError);
        return NextResponse.json(
          { error: `Extraction record not found for id: ${extractionId}` },
          { status: 404 }
        );
      }

      // Map DB record to ExtractionData
      data = {
        insured_name: record.insured_name,
        insured_address: record.insured_address,
        mv_file_no: record.mv_file_no ?? "",
        plate_no: record.plate_no ?? "",
        conduction_sticker: record.conduction_sticker ?? "",
        make: record.make,
        model_series: record.model_series,
        year_model: record.year_model ?? "",
        type_of_body: record.type_of_body ?? "",
        serial_chassis_no: record.serial_chassis_no,
        motor_no: record.motor_no,
        capacity: record.capacity ?? "",
        unladen_weight: record.unladen_weight ?? "",
        color: record.color ?? "",
        registration_date: record.registration_date ?? "",
      };
    } else {
      data = extractedData!;
    }

    // Generate the Annex-C PDF
    const pdfBytes = await generateAnnexCPdf(data);

    // Upload to Supabase Storage
    const pdfFilename = `annex-c-${randomUUID()}.pdf`;
    const { data: uploadData, error: uploadError } = await getSupabaseAdmin().storage
      .from("generated-pdfs")
      .upload(pdfFilename, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("PDF upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload generated PDF to storage." },
        { status: 500 }
      );
    }

    // Get signed URL for the generated PDF (bucket is private)
    const { data: signedData, error: signedError } = await getSupabaseAdmin().storage
      .from("generated-pdfs")
      .createSignedUrl(uploadData.path, 86400); // 24 hour expiry

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);
      return NextResponse.json(
        { error: "PDF generated but failed to create download URL." },
        { status: 500 }
      );
    }

    const pdfUrl = signedData.signedUrl;

    // If extractionId was provided, update the extraction record
    if (extractionId) {
      const { error: updateError } = await getSupabaseAdmin()
        .from("extractions")
        .update({ pdf_url: pdfUrl, status: "completed" })
        .eq("id", extractionId);

      if (updateError) {
        console.error("Extraction record update error:", updateError);
        // Non-fatal — PDF was generated, just failed to update the record
      }
    }

    return NextResponse.json({ pdfUrl }, { status: 200 });
  } catch (err) {
    console.error("Generate PDF route error:", err);
    return NextResponse.json(
      { error: "Internal server error during PDF generation." },
      { status: 500 }
    );
  }
}
