-- 018: Clinical profile fields needed to derive risk drivers and care gaps from stored data.
ALTER TABLE aksh.network_patients ADD COLUMN IF NOT EXISTS conditions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE aksh.network_patients ADD COLUMN IF NOT EXISTS foot_risk TEXT CHECK (foot_risk IN ('low', 'moderate', 'high'));
ALTER TABLE aksh.network_patients ADD COLUMN IF NOT EXISTS last_eye_screening DATE;
ALTER TABLE aksh.network_patients ADD COLUMN IF NOT EXISTS last_foot_check DATE;
ALTER TABLE aksh.network_patients ADD COLUMN IF NOT EXISTS next_appointment TIMESTAMPTZ;
