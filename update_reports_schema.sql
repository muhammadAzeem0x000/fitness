
-- 1. Add the report_type column if it doesn't exist
ALTER TABLE public.ai_reports 
ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'weekly';

-- 2. Update any existing records that might be null (just in case they were created before the default was applied)
UPDATE public.ai_reports
SET report_type = 'weekly'
WHERE report_type IS NULL;

-- 3. (Optional) Force the column to be not null to ensure data integrity moving forward
ALTER TABLE public.ai_reports
ALTER COLUMN report_type SET NOT NULL;

-- 4. Comment for clarity
COMMENT ON COLUMN public.ai_reports.report_type IS 'Type of the report: daily, weekly, or monthly';

-- 5. Verify the change by selecting a few rows
SELECT id, report_type, created_at FROM public.ai_reports LIMIT 5;
