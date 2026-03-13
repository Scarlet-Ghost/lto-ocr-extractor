-- Run this SQL in Supabase SQL Editor after schema.sql
-- Creates the quotes table for insurance premium computation

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES extractions(id),
  vehicle_srp NUMERIC(12,2),
  srp_source TEXT,
  depreciation_years INTEGER,
  depreciation_rate NUMERIC(5,4) DEFAULT 0.2000,
  fair_market_value NUMERIC(12,2),
  sum_insured NUMERIC(12,2),
  sum_insured_override BOOLEAN DEFAULT false,
  premium_rate NUMERIC(6,4),
  basic_premium NUMERIC(12,2),
  ctpl_premium NUMERIC(12,2),
  documentary_stamps NUMERIC(12,2),
  vat NUMERIC(12,2),
  local_gov_tax NUMERIC(12,2),
  total_amount_due NUMERIC(12,2),
  premium_override BOOLEAN DEFAULT false,
  policy_number TEXT,
  policy_period_from DATE,
  policy_period_to DATE,
  customer_email TEXT,
  customer_phone TEXT,
  quote_token TEXT UNIQUE,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  customer_note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_token ON quotes(quote_token);
CREATE INDEX idx_quotes_extraction ON quotes(extraction_id);
