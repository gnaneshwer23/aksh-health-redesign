-- Results delivered by a connector are attributed to the connector key that sent them (a connector is not a user, so
-- recorded_by stays empty). Every stored observation is then attributable: a person (recorded_by) or a key.
ALTER TABLE aksh.network_observations
  ADD COLUMN IF NOT EXISTS connector_key_id TEXT REFERENCES aksh.connector_keys(id);

ALTER TABLE aksh.network_observations DROP CONSTRAINT IF EXISTS network_observations_connector_attributed;
ALTER TABLE aksh.network_observations ADD CONSTRAINT network_observations_connector_attributed
  CHECK (channel IS DISTINCT FROM 'connector' OR connector_key_id IS NOT NULL);
