-- 033: CGM readings can also arrive from a device connector (FHIR Observation) as well as file uploads.
ALTER TABLE aksh.cgm_uploads DROP CONSTRAINT IF EXISTS cgm_uploads_uploader_kind_check;
ALTER TABLE aksh.cgm_uploads ADD CONSTRAINT cgm_uploads_uploader_kind_check CHECK (uploader_kind IN ('patient', 'staff', 'connector'));
ALTER TABLE aksh.connector_events DROP CONSTRAINT IF EXISTS connector_events_kind_check;
ALTER TABLE aksh.connector_events ADD CONSTRAINT connector_events_kind_check CHECK (kind IN ('slot', 'appointment', 'observation'));
