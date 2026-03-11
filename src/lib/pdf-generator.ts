import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ExtractionData } from './types';

/**
 * PDF Generator for Annex-C (COC) template.
 *
 * The Annex-C template is a scanned document (not a fillable form),
 * so we overlay text at specific coordinates using pdf-lib.
 *
 * Coordinate system: origin is bottom-left of the page.
 * Page size: US Letter (612 x 792 points).
 *
 * NOTE: Coordinates are initial estimates based on the template layout
 * and will need fine-tuning during QA with real documents.
 */

// Field coordinate map — all positions in PDF points (bottom-left origin)
const FIELD_POSITIONS = {
  // Insured/Assured info (top-left box)
  insured_name: { x: 42, y: 608, fontSize: 10, bold: true },
  insured_address: { x: 42, y: 594, fontSize: 8, bold: false },

  // Row 1 of Covered Vehicle table:
  // MODEL | MAKE | TYPE OF BODY | COLOR | M.V. FILE NO.
  model_series: { x: 42, y: 538, fontSize: 9, bold: false },
  make: { x: 160, y: 538, fontSize: 9, bold: false },
  type_of_body: { x: 280, y: 538, fontSize: 9, bold: false },
  color: { x: 380, y: 538, fontSize: 9, bold: false },
  mv_file_no: { x: 460, y: 538, fontSize: 9, bold: false },

  // Row 2 of Covered Vehicle table:
  // PLATE NO. | SERIAL/CHASSIS NO. | MOTOR NO. | AUTH. CAPACITY | UNLADEN WEIGHT
  plate_no: { x: 42, y: 514, fontSize: 9, bold: false },
  serial_chassis_no: { x: 160, y: 514, fontSize: 9, bold: false },
  motor_no: { x: 310, y: 514, fontSize: 9, bold: false },
  capacity: { x: 420, y: 514, fontSize: 9, bold: false },
  unladen_weight: { x: 500, y: 514, fontSize: 9, bold: false },

  // Limit of Liability
  limit_of_liability: { x: 420, y: 480, fontSize: 10, bold: true },
} as const;

/**
 * Loads the blank Annex-C template from the public directory.
 * Supports both server-side (filesystem) and client-side (fetch) loading.
 */
async function loadTemplate(): Promise<ArrayBuffer> {
  // Server-side: read from filesystem
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'annex-c-template.pdf');
    const buffer = fs.readFileSync(templatePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  // Client-side: fetch from public URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const response = await fetch(`${baseUrl}/templates/annex-c-template.pdf`);
  if (!response.ok) {
    throw new Error(`Failed to load Annex-C template: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Generate a filled Annex-C PDF from extraction data.
 *
 * @param data - Extracted vehicle/insured data from OCR
 * @returns PDF as Uint8Array ready for download or storage
 */
export async function generateAnnexCPdf(data: ExtractionData): Promise<Uint8Array> {
  const templateBytes = await loadTemplate();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();

  if (pages.length === 0) {
    throw new Error('Annex-C template has no pages');
  }

  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textColor = rgb(0, 0, 0);

  // Helper: draw text at a coordinate, skipping empty values
  const drawField = (
    text: string | undefined | null,
    position: { x: number; y: number; fontSize: number; bold: boolean }
  ) => {
    if (!text) return;
    page.drawText(text, {
      x: position.x,
      y: position.y,
      size: position.fontSize,
      font: position.bold ? boldFont : font,
      color: textColor,
    });
  };

  // --- Fill all fields ---

  // Insured info
  drawField(data.insured_name, FIELD_POSITIONS.insured_name);
  drawField(data.insured_address, FIELD_POSITIONS.insured_address);

  // Vehicle table row 1
  drawField(data.model_series, FIELD_POSITIONS.model_series);
  drawField(data.make, FIELD_POSITIONS.make);
  drawField(data.type_of_body, FIELD_POSITIONS.type_of_body);
  drawField(data.color, FIELD_POSITIONS.color);
  drawField(data.mv_file_no, FIELD_POSITIONS.mv_file_no);

  // Vehicle table row 2
  // Use plate_no if available, fall back to conduction_sticker
  drawField(
    data.plate_no || data.conduction_sticker || '',
    FIELD_POSITIONS.plate_no
  );
  drawField(data.serial_chassis_no, FIELD_POSITIONS.serial_chassis_no);
  drawField(data.motor_no, FIELD_POSITIONS.motor_no);
  drawField(data.capacity, FIELD_POSITIONS.capacity);
  drawField(data.unladen_weight, FIELD_POSITIONS.unladen_weight);

  // Fixed limit of liability
  drawField('100,000.00', FIELD_POSITIONS.limit_of_liability);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
