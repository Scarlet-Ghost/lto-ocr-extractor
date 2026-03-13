import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ExtractionData } from './types';

/**
 * PDF Generator for Annex-C Stand-Alone Private Car Policy template.
 *
 * The Annex-C template is a scanned document (not a fillable form),
 * so we overlay text at specific coordinates using pdf-lib.
 *
 * Coordinate system: origin is bottom-left of the page.
 * Actual page size: 608.4 x 928.56 points (8.45" x 12.90")
 *
 * Coordinates calibrated against the actual Annex-C template:
 * - Page has header (company name area) at top
 * - "STAND-ALONE PRIVATE CAR POLICY" title
 * - Policy info block (policy no, name/address, dates)
 * - Covered Vehicle table (2 rows)
 * - Section I/II Third Party Liability with Limit of Liability
 * - Premiums table
 * - Terms and conditions text
 */

// All coordinates measured from bottom-left of 608.4 x 928.56 page
// Calibrated against grid overlay + visual comparison on 2026-03-11 (v4)
const FIELDS = {
  // Name and Address of Insured/Assured box (upper-middle of page)
  insured_name:    { x: 38, y: 768, size: 9, bold: true },
  insured_address: { x: 38, y: 756, size: 7.5, bold: false },

  // COVERED VEHICLE table — Row 1 (data cells below column headers)
  // Column boundaries: MODEL ~30-130 | MAKE ~130-260 | TYPE ~260-380 | COLOR ~380-480 | MVFILE ~480-580
  model_series:  { x: 35,  y: 696, size: 7, bold: false },
  make:          { x: 135, y: 696, size: 7, bold: false },
  type_of_body:  { x: 265, y: 696, size: 7, bold: false },
  color:         { x: 385, y: 696, size: 7, bold: false },
  mv_file_no:    { x: 485, y: 696, size: 6, bold: false },

  // COVERED VEHICLE table — Row 2
  // Column boundaries: PLATE ~30-130 | CHASSIS ~130-265 | MOTOR ~265-400 | CAPACITY ~400-500 | WEIGHT ~500-580
  plate_no:          { x: 35,  y: 677, size: 7, bold: false },
  serial_chassis_no: { x: 135, y: 677, size: 6, bold: false },
  motor_no:          { x: 268, y: 677, size: 6, bold: false },
  capacity:          { x: 410, y: 677, size: 7, bold: false },
  unladen_weight:    { x: 508, y: 677, size: 6.5, bold: false },

  // SECTION I/II — Limit of Liability (fixed P 100,000.00 for vehicle-only PDFs)
  limit_of_liability: { x: 435, y: 657, size: 9, bold: true },
} as const;

// Policy and premium field coordinates
// Right side of page, upper area (to the right of the name/address box).
// Relative anchors:
//   - insured_name is at y=768 (top of name/address box)
//   - Vehicle row 1 at y=696, row 2 at y=677, limit_of_liability at y=657
// Policy info sits in the right column at roughly the same vertical band
// as the name/address box, then the premium amount is in the AMOUNTS section.
const POLICY_FIELDS = {
  // Policy identification (right column, upper area)
  policy_number:    { x: 420, y: 800, size: 8, bold: false },
  date_issued:      { x: 340, y: 760, size: 8, bold: false },
  official_receipt: { x: 460, y: 760, size: 7, bold: false },

  // Period of insurance (below date_issued)
  period_from:      { x: 340, y: 738, size: 8, bold: false },
  period_to:        { x: 460, y: 738, size: 8, bold: false },

  // Premium section (right side, amounts column, below Section I/II table)
  premium_paid:     { x: 460, y: 623, size: 8, bold: true },
} as const;

async function loadTemplate(): Promise<ArrayBuffer> {
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'annex-c-template.pdf');
    const buffer = fs.readFileSync(templatePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const response = await fetch(`${baseUrl}/templates/annex-c-template.pdf`);
  if (!response.ok) {
    throw new Error(`Failed to load Annex-C template: ${response.status}`);
  }
  return response.arrayBuffer();
}

/**
 * Generate a filled Annex-C PDF from extraction data.
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

  const draw = (text: string | undefined | null, field: { x: number; y: number; size: number; bold: boolean }) => {
    if (!text) return;
    page.drawText(text, {
      x: field.x,
      y: field.y,
      size: field.size,
      font: field.bold ? boldFont : font,
      color: textColor,
    });
  };

  // Insured info
  draw(data.insured_name, FIELDS.insured_name);

  // Wrap long addresses
  const address = data.insured_address || '';
  if (address.length > 80) {
    const mid = address.lastIndexOf(',', 80);
    const breakPoint = mid > 40 ? mid + 1 : 80;
    draw(address.slice(0, breakPoint).trim(), FIELDS.insured_address);
    draw(address.slice(breakPoint).trim(), { ...FIELDS.insured_address, y: FIELDS.insured_address.y - 10 });
  } else {
    draw(address, FIELDS.insured_address);
  }

  // Vehicle table row 1
  draw(data.model_series, FIELDS.model_series);
  draw(data.make, FIELDS.make);
  draw(data.type_of_body, FIELDS.type_of_body);
  draw(data.color, FIELDS.color);
  draw(data.mv_file_no, FIELDS.mv_file_no);

  // Vehicle table row 2
  draw(data.plate_no || data.conduction_sticker || '', FIELDS.plate_no);
  draw(data.serial_chassis_no, FIELDS.serial_chassis_no);
  draw(data.motor_no, FIELDS.motor_no);
  draw(data.capacity, FIELDS.capacity);
  draw(data.unladen_weight, FIELDS.unladen_weight);

  // Fixed limit of liability
  draw('100,000.00', FIELDS.limit_of_liability);

  return await pdfDoc.save();
}

export interface PolicyInfo {
  policy_number: string;
  date_issued: string;        // MM/DD/YYYY
  official_receipt?: string;
  period_from: string;        // MM/DD/YYYY
  period_to: string;          // MM/DD/YYYY
  premium_paid: number;
  sum_insured: number;
}

/**
 * Format a number as a comma-separated decimal string (e.g. 15475.07 → "15,475.07").
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate a fully-filled Annex-C policy PDF.
 *
 * Fills all vehicle fields (same as generateAnnexCPdf) PLUS policy
 * identification, period of insurance, and premium amount fields.
 * Uses the actual sum_insured as the limit of liability instead of the
 * hardcoded P 100,000.00 used in the vehicle-only variant.
 */
export async function generatePolicyPdf(
  data: ExtractionData,
  policyInfo: PolicyInfo
): Promise<Uint8Array> {
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

  const draw = (
    text: string | undefined | null,
    field: { x: number; y: number; size: number; bold: boolean }
  ) => {
    if (!text) return;
    page.drawText(text, {
      x: field.x,
      y: field.y,
      size: field.size,
      font: field.bold ? boldFont : font,
      color: textColor,
    });
  };

  // --- Vehicle / insured fields (same as generateAnnexCPdf) ---

  // Insured info
  draw(data.insured_name, FIELDS.insured_name);

  const address = data.insured_address || '';
  if (address.length > 80) {
    const mid = address.lastIndexOf(',', 80);
    const breakPoint = mid > 40 ? mid + 1 : 80;
    draw(address.slice(0, breakPoint).trim(), FIELDS.insured_address);
    draw(address.slice(breakPoint).trim(), {
      ...FIELDS.insured_address,
      y: FIELDS.insured_address.y - 10,
    });
  } else {
    draw(address, FIELDS.insured_address);
  }

  // Vehicle table row 1
  draw(data.model_series, FIELDS.model_series);
  draw(data.make, FIELDS.make);
  draw(data.type_of_body, FIELDS.type_of_body);
  draw(data.color, FIELDS.color);
  draw(data.mv_file_no, FIELDS.mv_file_no);

  // Vehicle table row 2
  draw(data.plate_no || data.conduction_sticker || '', FIELDS.plate_no);
  draw(data.serial_chassis_no, FIELDS.serial_chassis_no);
  draw(data.motor_no, FIELDS.motor_no);
  draw(data.capacity, FIELDS.capacity);
  draw(data.unladen_weight, FIELDS.unladen_weight);

  // Limit of liability — use actual sum_insured from the policy
  draw(formatAmount(policyInfo.sum_insured), FIELDS.limit_of_liability);

  // --- Policy identification fields ---
  draw(policyInfo.policy_number, POLICY_FIELDS.policy_number);
  draw(policyInfo.date_issued, POLICY_FIELDS.date_issued);
  if (policyInfo.official_receipt) {
    draw(policyInfo.official_receipt, POLICY_FIELDS.official_receipt);
  }

  // Period of insurance
  draw(policyInfo.period_from, POLICY_FIELDS.period_from);
  draw(policyInfo.period_to, POLICY_FIELDS.period_to);

  // Premium paid
  draw(formatAmount(policyInfo.premium_paid), POLICY_FIELDS.premium_paid);

  return await pdfDoc.save();
}
