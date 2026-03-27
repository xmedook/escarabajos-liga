import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface Props {
  permission?: string;
  roles?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ permission, roles, children, fallback = null }: Props) {
  const { user, can } = useAuth();

  if (roles && !roles.includes(user?.rol || "")) return <>{fallback}</>;
  if (permission && !can(permission)) return <>{fallback}</>;

  return <>{children}</>;
}
