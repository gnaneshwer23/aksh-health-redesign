import { NextResponse } from "next/server";

import { buildRolePermissionMatrix } from "../../../../lib/permission-matrix";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { userEmail } = auth.context;
  const matrix = buildRolePermissionMatrix({
    generatedBy: userEmail ?? undefined
  });

  return NextResponse.json(matrix, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-role-permission-matrix.json\""
    }
  });
}
