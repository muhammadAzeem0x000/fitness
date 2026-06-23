CREATE TABLE daily_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC(4,1) DEFAULT 0,
  active_calories INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS: Users can only access their own data
ALTER TABLE daily_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own health data" ON daily_health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own health data" ON daily_health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own health data" ON daily_health_metrics
  FOR UPDATE USING (auth.uid() = user_id);
