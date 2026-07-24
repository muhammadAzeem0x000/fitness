-- Persist push delivery state so a generated report is not treated as
-- successfully notified when Firebase rejects or temporarily delays the send.
ALTER TABLE public.ai_reports
    ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notification_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notification_last_error TEXT;

COMMENT ON COLUMN public.ai_reports.notification_sent_at IS
    'Time at which at least one registered device accepted the report notification.';
COMMENT ON COLUMN public.ai_reports.notification_attempts IS
    'Number of Firebase delivery attempts made for this report.';
COMMENT ON COLUMN public.ai_reports.notification_last_error IS
    'Most recent sanitized Firebase delivery error, if any.';

-- Do not send a large historical backlog after deploying this migration.
-- Reports from the last 14 days remain pending so the latest missed report can
-- be retried after Firebase configuration is repaired.
UPDATE public.ai_reports
SET notification_sent_at = created_at
WHERE notification_sent_at IS NULL
  AND created_at < NOW() - INTERVAL '14 days';

CREATE INDEX IF NOT EXISTS ai_reports_pending_notification_idx
    ON public.ai_reports (created_at)
    WHERE notification_sent_at IS NULL;
