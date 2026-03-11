-- Run this SQL in Supabase SQL Editor to create the table and indexes
--
-- Also create these storage buckets in Supabase Dashboard > Storage:
-- 1. orcr-documents (private)
-- 2. generated-pdfs (private)

CREATE TABLE extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  original_file_url TEXT NOT NULL,
  original_file_type TEXT NOT NULL CHECK (original_file_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  insured_name TEXT NOT NULL,
  insured_address TEXT NOT NULL,
  mv_file_no TEXT,
  plate_no TEXT,
  conduction_sticker TEXT,
  make TEXT NOT NULL,
  model_series TEXT NOT NULL,
  year_model TEXT,
  type_of_body TEXT,
  serial_chassis_no TEXT NOT NULL,
  motor_no TEXT NOT NULL,
  capacity TEXT,
  unladen_weight TEXT,
  color TEXT,
  registration_date DATE,
  confidence_scores JSONB NOT NULL DEFAULT '{}',
  audit_flags JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed'))
);

CREATE INDEX idx_extractions_created_at ON extractions (created_at DESC);
CREATE INDEX idx_extractions_insured_name ON extractions USING gin (to_tsvector('english', insured_name));
CREATE INDEX idx_extractions_plate_no ON extractions (plate_no);
