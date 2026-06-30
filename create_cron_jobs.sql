-- Ensure pg_net and pg_cron are enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Set up the cron job for AI Reports (Runs every hour to check for eligible users)
SELECT cron.schedule(
  'generate_ai_reports_cron',
  '0 * * * *', -- Every hour at minute 0
  $$
    SELECT net.http_post(
      url:='https://hvjchdgthkxqdvxrjero.supabase.co/functions/v1/generate-ai-reports',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2amNoZGd0aGt4cWR2eHJqZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjg1MjQsImV4cCI6MjA4NDg0NDUyNH0.zIngHNW3FgVeSYL8DDfDGNn_-7SVQSYuj6Tuv68p5QY"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);
