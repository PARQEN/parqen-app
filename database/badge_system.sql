-- ============================================================
-- PRAQEN Badge Achievement System — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name  VARCHAR(100) NOT NULL,
  is_unlocked BOOLEAN      DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, badge_name)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- 2. Row-Level Security
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges"   ON user_badges;
DROP POLICY IF EXISTS "Service role full access" ON user_badges;

-- Public profiles: anyone can read any user's badges
CREATE POLICY "Anyone can view badges" ON user_badges
  FOR SELECT USING (true);

-- Backend (service role key) bypasses RLS for writes automatically

-- 3. Seed locked badge rows for every existing user
-- (so the frontend immediately shows all badges as locked, not empty)
INSERT INTO user_badges (user_id, badge_name, is_unlocked)
SELECT u.id, b.badge_name, false
FROM users u
CROSS JOIN (
  VALUES
    ('Verified Identity'),
    ('Top Trader'),
    ('High Volume'),
    ('Fast Responder'),
    ('Trusted Seller'),
    ('Veteran Trader')
) AS b(badge_name)
ON CONFLICT (user_id, badge_name) DO NOTHING;

-- 4. Immediately unlock badges for users who already qualify
-- Verified Identity
UPDATE user_badges ub
SET is_unlocked = true, unlocked_at = NOW()
FROM users u
WHERE ub.user_id = u.id
  AND ub.badge_name = 'Verified Identity'
  AND (u.kyc_verified = true OR u.is_id_verified = true);

-- Top Trader (100+ trades)
UPDATE user_badges ub
SET is_unlocked = true, unlocked_at = NOW()
FROM users u
WHERE ub.user_id = u.id
  AND ub.badge_name = 'Top Trader'
  AND COALESCE(u.total_trades, 0) >= 100;

-- High Volume ($10,000+ assuming ~$100/trade average)
UPDATE user_badges ub
SET is_unlocked = true, unlocked_at = NOW()
FROM users u
WHERE ub.user_id = u.id
  AND ub.badge_name = 'High Volume'
  AND COALESCE(u.total_trades, 0) * 100 >= 10000;

-- Trusted Seller (20+ trades, 98%+ completion rate)
UPDATE user_badges ub
SET is_unlocked = true, unlocked_at = NOW()
FROM users u
WHERE ub.user_id = u.id
  AND ub.badge_name = 'Trusted Seller'
  AND COALESCE(u.total_trades, 0) >= 20
  AND COALESCE(u.completion_rate, 0) >= 98;

-- Veteran Trader (account older than 1 year)
UPDATE user_badges ub
SET is_unlocked = true, unlocked_at = NOW()
FROM users u
WHERE ub.user_id = u.id
  AND ub.badge_name = 'Veteran Trader'
  AND u.created_at <= NOW() - INTERVAL '1 year';

-- 5. Also fix the trust badge tier for existing users (only upgrade, keep LEGEND/AMBASSADOR etc.)
UPDATE users
SET badge = CASE
  WHEN total_trades >= 500 THEN 'LEGEND'
  WHEN total_trades >= 200 THEN 'AMBASSADOR'
  WHEN total_trades >= 100 THEN 'EXPERT'
  WHEN total_trades >= 25  THEN 'PRO'
  ELSE badge  -- don't downgrade if manually set higher
END
WHERE badge IN ('BEGINNER', 'PRO', 'EXPERT')  -- never overwrite LEGEND or AMBASSADOR if manually elevated
  AND (
    (total_trades >= 500 AND badge != 'LEGEND')
    OR (total_trades >= 200 AND badge NOT IN ('LEGEND', 'AMBASSADOR'))
    OR (total_trades >= 100 AND badge NOT IN ('LEGEND', 'AMBASSADOR', 'EXPERT'))
    OR (total_trades >= 25  AND badge = 'BEGINNER')
  );
