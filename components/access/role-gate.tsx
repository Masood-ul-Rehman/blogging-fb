"use client";

import type { ReactNode } from "react";
import { type Role, useRole } from "@/lib/roles";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function RoleGate({
  allow,
  children,
  fallback = null,
  showNavigation = true,
}: {
  allow: Role[] | Role;
  children: ReactNode;
  fallback?: ReactNode;
  showNavigation?: boolean;
}) {
  const role = useRole();
  const allowedArray = Array.isArray(allow) ? allow : [allow];
  const ok = allowedArray.includes(role);

  if (ok) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback with navigation
  return (
    <div className="min-h-dvh flex flex-col">
      {showNavigation && <AppHeader />}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <Alert>
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Your current role <Badge variant="secondary">{role}</Badge> does
              not have permission to access this resource. Contact an{" "}
              <Badge variant="secondary">admin</Badge> if you need access.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
