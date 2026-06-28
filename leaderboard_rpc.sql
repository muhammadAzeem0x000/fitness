-- 1. Enhanced function to calculate top 50 users by workout volume, with optional time filter
CREATE OR REPLACE FUNCTION get_top_users(time_filter text DEFAULT 'all')
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_volume numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    COALESCE(SUM(
      (
        SELECT COALESCE(SUM(
          CASE 
            WHEN (set_obj->>'weight') ~ '^[0-9]+(\.[0-9]+)?$' AND (set_obj->>'reps') ~ '^[0-9]+(\.[0-9]+)?$' 
            THEN (set_obj->>'weight')::numeric * (set_obj->>'reps')::numeric
            ELSE 0 
          END
        ), 0)
        FROM jsonb_each(wl.exercises) AS e(key, sets_arr),
             jsonb_array_elements(e.sets_arr) AS set_obj
        WHERE jsonb_typeof(wl.exercises) = 'object'
      )
    ), 0) as total_volume
  FROM profiles p
  LEFT JOIN workout_logs wl ON p.id = wl.user_id 
    AND (
      time_filter = 'all' OR
      (time_filter = 'week' AND wl.date >= now() - interval '7 days') OR
      (time_filter = 'month' AND wl.date >= now() - interval '30 days')
    )
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_volume DESC
  LIMIT 50;
END;
$$;

-- 2. New function for consistency (number of workouts)
CREATE OR REPLACE FUNCTION get_most_consistent_users(time_filter text DEFAULT 'all')
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  workout_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    COUNT(wl.id) as workout_count
  FROM profiles p
  LEFT JOIN workout_logs wl ON p.id = wl.user_id 
    AND (
      time_filter = 'all' OR
      (time_filter = 'week' AND wl.date >= now() - interval '7 days') OR
      (time_filter = 'month' AND wl.date >= now() - interval '30 days')
    )
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY workout_count DESC
  LIMIT 50;
END;
$$;

-- 3. New function for current longest streak
CREATE OR REPLACE FUNCTION get_top_streaks()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  current_streak integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_weeks AS (
    SELECT DISTINCT
      p.id as uid,
      COALESCE(p.display_name, 'Anonymous') as dname,
      p.avatar_url as aurl,
      date_trunc('week', wl.date) as workout_week
    FROM profiles p
    JOIN workout_logs wl ON p.id = wl.user_id
  ),
  streak_calc AS (
    SELECT 
      uid, dname, aurl, workout_week,
      workout_week - (row_number() over (partition by uid order by workout_week)) * interval '1 week' as grp
    FROM user_weeks
  ),
  streak_lengths AS (
    SELECT 
      uid, dname, aurl,
      COUNT(*) as streak_len,
      MAX(workout_week) as max_week
    FROM streak_calc
    GROUP BY uid, dname, aurl, grp
  )
  SELECT 
    uid as user_id,
    dname as display_name,
    aurl as avatar_url,
    streak_len::integer as current_streak
  FROM streak_lengths
  -- Only count streaks that are "active" (include this week or last week)
  WHERE max_week >= date_trunc('week', now()) - interval '1 week'
  ORDER BY current_streak DESC
  LIMIT 50;
END;
$$;
