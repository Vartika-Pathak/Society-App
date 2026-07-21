import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
