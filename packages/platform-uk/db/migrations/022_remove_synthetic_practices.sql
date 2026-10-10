-- 022: Remove the synthetic UK practice rows seeded by 009. Nothing reads aksh.practices any more (organisations live
-- in aksh.organisations), and production must not carry fictional records.
DELETE FROM aksh.practices WHERE synthetic = TRUE;
