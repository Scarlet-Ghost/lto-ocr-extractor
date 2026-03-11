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
