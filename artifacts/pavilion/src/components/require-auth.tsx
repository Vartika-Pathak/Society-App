import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@workspace/api-client-react";

interface RequireAuthProps {
  children: React.ReactNode;
  /** If set, only these roles may view the page; anyone else is bounced to /dashboard. */
  roles?: AuthUser["role"][];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
