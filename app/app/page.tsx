"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import React, { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

// Simple auth state component
function AuthButton() {
  const enabled = isClerkEnabled();

  if (!enabled) {
    return (
      <Button asChild size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  const { SignedOut } = require("@clerk/nextjs");
  return (
    // <SignedOut>
    //   <Button asChild size="sm">
    //     <Link href="/sign-in">Sign in</Link>
    //   </Button>
    // </SignedOut>'
    <></>
  );
}

export default function Page() {
  useEffect(() => {
    document.title = "App | Blog Proto";
  }, []);

  const enabled = useMemo(isClerkEnabled, []);
  const role = useRole();

  return (
    <main className="container mx-auto max-w-5xl flex-1 p-4 md:p-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-balance">
            Content Management Dashboard
          </CardTitle>
          <CardDescription>
            Manage your content resources and view analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{role}</span>
            </div>
            <AuthButton />
            {!enabled ? (
              <div className="text-xs text-muted-foreground">
                Tip: Configure Clerk and Convex via environment variables to use
                real backends.
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📊 Dashboard</CardTitle>
                <CardDescription>
                  View content metrics and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app/dashboard">View Dashboard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📚 Content</CardTitle>
                <CardDescription>
                  Manage and browse content items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app/content">Manage Content</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">➕ Add Content</CardTitle>
                <CardDescription>Create new content entries</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/content/new">Add Content</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 text-xs text-muted-foreground space-y-1">
        <p>
          To enable Clerk: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
          CLERK_SECRET_KEY.
        </p>
        <p>
          To enable Convex: set NEXT_PUBLIC_CONVEX_URL and use Convex functions
          for resources.
        </p>
      </section>
    </main>
  );
}
