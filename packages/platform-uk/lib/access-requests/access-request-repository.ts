import { randomUUID } from "node:crypto";

import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import type { AccessRequestInput } from "@/lib/access-requests/validation";

export type AccessRequestRecord = {
  id: string;
  orgType: string;
  orgName: string;
  odsCode: string | null;
  region: string | null;
  contactName: string;
  contactEmail: string;
  ehrSystems: string[];
  listSize: string | null;
  itContact: string | null;
  commitments: string[];
  status: string;
  createdAt: string;
};

type AccessRequestRow = {
  id: string;
  org_type: string;
  org_name: string;
  ods_code: string | null;
  region: string | null;
  contact_name: string;
  contact_email: string;
  ehr_systems: string[] | null;
  list_size: string | null;
  it_contact: string | null;
  commitments: string[] | null;
  status: string;
  created_at: Date;
};

function mapRow(row: AccessRequestRow): AccessRequestRecord {
  return {
    id: row.id,
    orgType: row.org_type,
    orgName: row.org_name,
    odsCode: row.ods_code,
    region: row.region,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    ehrSystems: row.ehr_systems ?? [],
    listSize: row.list_size,
    itContact: row.it_contact,
    commitments: row.commitments ?? [],
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

function createRequestId() {
  return randomUUID();
}

export async function insertAccessRequest(input: AccessRequestInput): Promise<AccessRequestRecord> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  const id = createRequestId();
  const pool = getPgPool();
  const result = await pool.query<AccessRequestRow>(
    `INSERT INTO aksh.pilot_applications (
       id, org_type, org_name, ods_code, region, contact_name, contact_email,
       ehr_systems, list_size, it_contact, commitments, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'submitted')
     RETURNING id, org_type, org_name, ods_code, region, contact_name, contact_email,
               ehr_systems, list_size, it_contact, commitments, status, created_at`,
    [
      id,
      input.orgType,
      input.orgName,
      input.odsCode,
      input.region,
      input.contactName,
      input.contactEmail,
      input.ehrSystems,
      input.listSize,
      input.itContact?.trim() || null,
      input.commitments,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to save organisation enquiry");
  }

  return mapRow(row);
}

export async function listRecentAccessRequests(limit = 10): Promise<AccessRequestRecord[]> {
  if (!isPostgresConfigured()) return [];

  const pool = getPgPool();
  const result = await pool.query<AccessRequestRow>(
    `SELECT id, org_type, org_name, ods_code, region, contact_name, contact_email,
            ehr_systems, list_size, it_contact, commitments, status, created_at
     FROM aksh.pilot_applications
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapRow);
}
