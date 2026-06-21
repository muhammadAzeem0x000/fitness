-- Function to calculate top 50 users by workout volume
CREATE OR REPLACE FUNCTION get_top_users()
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
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_volume DESC
  LIMIT 50;
END;
$$;
