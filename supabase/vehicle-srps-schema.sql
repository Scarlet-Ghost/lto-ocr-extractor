-- Run this SQL in Supabase SQL Editor after schema.sql
-- Creates the vehicle_srps lookup table for SRP-based fair market value computation

CREATE TABLE vehicle_srps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_from INTEGER,
  year_to INTEGER,
  variant TEXT,
  body_type TEXT,
  srp NUMERIC(12,2) NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_srps_make_model ON vehicle_srps(make, model);
