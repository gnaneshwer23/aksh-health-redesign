import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signupRoles, type SignupRoleId } from "@/lib/content";
import { cn } from "@/lib/utils";

export function RoleSelector({
  selectedRole,
  onSelect,
  className,
}: {
  selectedRole?: SignupRoleId;
  onSelect?: (role: SignupRoleId) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {signupRoles.map((role) => {
        const isSelected = selectedRole === role.id;
        const content = (
          <Card
            className={cn(
              "h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{role.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">{role.description}</p>
            </CardContent>
          </Card>
        );

        if (onSelect) {
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className="text-left"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={role.id} href={`/signup?role=${role.id}`}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
