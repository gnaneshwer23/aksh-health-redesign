import { NextResponse } from "next/server";

import { buildClinicalSafetyFilesArtifact } from "../../../../lib/clinical-safety-files";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const artifact = buildClinicalSafetyFilesArtifact();

  return NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-clinical-safety-file-placeholders.json\""
    }
  });
}
