-- Add trade_ref column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_ref VARCHAR(20) UNIQUE;

-- Backfill existing trades that have no trade_ref
UPDATE trades
SET trade_ref = 'PRAQ-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE trade_ref IS NULL;

-- Create index for fast support lookups
CREATE INDEX IF NOT EXISTS idx_trades_trade_ref ON trades(trade_ref);
