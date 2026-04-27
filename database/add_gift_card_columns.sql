-- Run this in your Supabase SQL editor to add missing gift card columns

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS card_values  DECIMAL[]    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS card_type    VARCHAR(20)  DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS face_value   DECIMAL      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20)  DEFAULT 'market';
