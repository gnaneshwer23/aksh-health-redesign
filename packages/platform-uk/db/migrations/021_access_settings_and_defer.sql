-- 021: Organisation-owned slot-fill settings, deferral, and edited offers.
ALTER TABLE aksh.organisations ADD COLUMN IF NOT EXISTS access_settings JSONB NOT NULL DEFAULT '{}'::jsonb;
-- reasonOrder: ["overdue_care","patient_request","clinician_request"], maxOffersPer30Days: 3, suppressedChannels: []
ALTER TABLE aksh.access_workflows ADD COLUMN IF NOT EXISTS deferred_until TIMESTAMPTZ;
ALTER TABLE aksh.access_workflows ADD COLUMN IF NOT EXISTS offer_edited_by TEXT;
