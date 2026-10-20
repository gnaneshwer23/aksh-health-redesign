-- Laboratory results (lib/labs/catalog.ts): more result kinds, provenance on every observation, and corrections that
-- never overwrite. A corrected lab result is a new row that names the row it replaces; reads ignore replaced rows, and
-- both stay in the record (ALCOA+: original and correction are both kept, attributable and dated).

-- 1. Kinds: lipids, creatinine and ALT join HbA1c, glucose, eGFR, ACR and LDL.
ALTER TABLE aksh.network_observations DROP CONSTRAINT IF EXISTS network_observations_kind_check;
ALTER TABLE aksh.network_observations ADD CONSTRAINT network_observations_kind_check CHECK (kind IN (
  'hba1c', 'glucose', 'systolic_bp', 'diastolic_bp', 'weight', 'bmi', 'egfr', 'acr', 'ldl',
  'total_cholesterol', 'hdl', 'triglycerides', 'creatinine', 'alt',
  'cgm_time_in_range', 'cgm_time_below_range', 'hypo_event',
  'cgm_time_below_54', 'cgm_time_above_range', 'cgm_time_above_250', 'cgm_mean_glucose', 'cgm_gmi', 'cgm_cv', 'cgm_wear'
));

-- 2. Provenance: the code the source used, the source's own id for the result, how it reached Aksh, and corrections.
ALTER TABLE aksh.network_observations
  ADD COLUMN IF NOT EXISTS code TEXT,                       -- e.g. LOINC 4548-4, as sent by the source
  ADD COLUMN IF NOT EXISTS code_system TEXT,                -- e.g. http://loinc.org
  ADD COLUMN IF NOT EXISTS external_ref TEXT,               -- the source's id for this result (FHIR Observation.id)
  ADD COLUMN IF NOT EXISTS channel TEXT,                    -- how it arrived
  ADD COLUMN IF NOT EXISTS replaces_id TEXT REFERENCES aksh.network_observations(id);

ALTER TABLE aksh.network_observations DROP CONSTRAINT IF EXISTS network_observations_channel_check;
ALTER TABLE aksh.network_observations ADD CONSTRAINT network_observations_channel_check
  CHECK (channel IS NULL OR channel IN ('manual', 'csv_import', 'connector', 'patient_app', 'cgm'));

-- One correction per replaced row: a second correction replaces the first correction, so the chain stays linear.
CREATE UNIQUE INDEX IF NOT EXISTS network_observations_replaces ON aksh.network_observations (replaces_id) WHERE replaces_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS network_observations_external_ref ON aksh.network_observations (patient_id, external_ref) WHERE external_ref IS NOT NULL;

-- 3. A correction must be for the same patient and kind, and only a laboratory result can be corrected this way.
CREATE OR REPLACE FUNCTION aksh.guard_observation_replaces() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_row RECORD;
BEGIN
  IF NEW.replaces_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.replaces_id IS NOT DISTINCT FROM OLD.replaces_id THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'REPLACES_FINAL: a correction link cannot be changed'; END IF;
  SELECT patient_id, kind, source INTO old_row FROM aksh.network_observations WHERE id = NEW.replaces_id;
  IF NOT FOUND OR old_row.patient_id <> NEW.patient_id OR old_row.kind <> NEW.kind THEN
    RAISE EXCEPTION 'REPLACES_MISMATCH: a correction must be for the same patient and result';
  END IF;
  IF old_row.source <> 'lab' OR NEW.source <> 'lab' THEN
    RAISE EXCEPTION 'REPLACES_LAB_ONLY: only laboratory results are corrected by replacement';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS network_observations_replaces ON aksh.network_observations;
CREATE TRIGGER network_observations_replaces BEFORE INSERT OR UPDATE ON aksh.network_observations
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_observation_replaces();
