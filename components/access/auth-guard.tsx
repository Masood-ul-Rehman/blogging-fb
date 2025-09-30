"use client";

import { useAuth } from "@clerk/nextjs";
import { type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import Link from "next/link";

export function AuthGuard({
  children,
  fallback,
  showNavigation = true,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showNavigation?: boolean;
}) {
  const { isSignedIn, isLoaded } = useAuth();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex flex-col">
        {showNavigation && <AppHeader />}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-dvh flex flex-col">
        {showNavigation && <AppHeader />}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to sign in to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Create Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
