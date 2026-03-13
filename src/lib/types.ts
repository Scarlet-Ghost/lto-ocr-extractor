export interface ExtractionData {
  insured_name: string;
  insured_address: string;
  mv_file_no: string;
  plate_no: string;
  conduction_sticker: string;
  make: string;
  model_series: string;
  year_model: string;
  type_of_body: string;
  serial_chassis_no: string;
  motor_no: string;
  capacity: string;
  unladen_weight: string;
  color?: string;
  registration_date?: string;
}

export interface ConfidenceScores {
  [field: string]: number; // 0-100
}

export interface AuditFlags {
  is_blurry: boolean;
  missing_fields: string[];
  registration_status: "Current" | "Expired" | "Unknown";
  field_confidence: ConfidenceScores;
}

export interface ExtractionRecord {
  id: string;
  created_at: string;
  original_file_url: string;
  original_file_type: string;
  insured_name: string;
  insured_address: string;
  mv_file_no: string | null;
  plate_no: string | null;
  conduction_sticker: string | null;
  make: string;
  model_series: string;
  year_model: string | null;
  type_of_body: string | null;
  serial_chassis_no: string;
  motor_no: string;
  capacity: string | null;
  unladen_weight: string | null;
  color: string | null;
  registration_date: string | null;
  confidence_scores: ConfidenceScores;
  audit_flags: AuditFlags;
  pdf_url: string | null;
  status: "draft" | "completed";
}

export interface PolicyHeader {
  broker: string;
  form_type: string;
  limit_of_liability: number;
}

export interface ExtractionResponse {
  policy_header: PolicyHeader;
  extracted_data: ExtractionData;
  audit_flags: AuditFlags;
}

// === Phase 2: Quote-to-Policy Types ===

export interface VehicleSrp {
  id: string;
  make: string;
  model: string;
  year_from: number | null;
  year_to: number | null;
  variant: string | null;
  body_type: string | null;
  srp: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DepreciationResult {
  srp: number;
  vehicleAge: number;
  depreciationPercent: number;
  fairMarketValue: number;
}

export interface PremiumBreakdown {
  // Vehicle valuation
  vehicleSrp: number;
  srpSource: 'lookup' | 'manual';
  depreciationYears: number;
  fairMarketValue: number;
  sumInsured: number;
  sumInsuredOverride: boolean;

  // Premium calculation
  premiumRate: number;
  basicPremium: number;
  ctplPremium: number;
  documentaryStamps: number;
  vat: number;
  localGovTax: number;
  authFees: number;
  totalAmountDue: number;
  premiumOverride: boolean;

  // Deductible info
  deductible: number;
}

export type VehicleCategory =
  | 'sedan'
  | 'hatchback'
  | 'suv'
  | 'mpv'
  | 'van'
  | 'pickup'
  | 'truck'
  | 'luxury';

export type QuoteStatus =
  | 'draft'
  | 'quoted'
  | 'viewed'
  | 'approved'
  | 'issued'
  | 'expired'
  | 'rejected';

export interface Quote {
  id: string;
  extraction_id: string;

  // Vehicle valuation
  vehicle_srp: number | null;
  srp_source: string | null;
  depreciation_years: number | null;
  depreciation_rate: number | null;
  fair_market_value: number | null;
  sum_insured: number | null;
  sum_insured_override: boolean;

  // Premium
  premium_rate: number | null;
  basic_premium: number | null;
  ctpl_premium: number | null;
  documentary_stamps: number | null;
  vat: number | null;
  local_gov_tax: number | null;
  total_amount_due: number | null;
  premium_override: boolean;

  // Policy
  policy_number: string | null;
  policy_period_from: string | null;
  policy_period_to: string | null;

  // Customer
  customer_email: string | null;
  customer_phone: string | null;

  // Sharing
  quote_token: string | null;

  // Status
  status: QuoteStatus;
  sent_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  issued_at: string | null;
  expires_at: string | null;
  customer_note: string | null;

  // Meta
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
