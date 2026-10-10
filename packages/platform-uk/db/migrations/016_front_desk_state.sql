-- 016: Front Desk (patient access) shared state. docs/PATIENT_ACCESS_AND_ASHA.md
-- One JSON document per practice with optimistic versioning. Track A synthetic data only.
-- Additive: no existing table is touched.
create schema if not exists aksh;

create table if not exists aksh.front_desk_state (
  practice_id text primary key,
  doc jsonb not null,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table aksh.front_desk_state is
  'Front Desk patient-access state (synthetic, Track A). Calendar, queues, patient-reported drafts, campaigns. Not a clinical record.';
