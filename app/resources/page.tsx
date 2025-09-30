"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ResourceList } from "@/components/resources/resource-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRole, canManageContent } from "@/lib/roles";
import { AppHeader } from "@/components/app-header";
import { Authenticated, Unauthenticated } from "convex/react";

export const dynamic = "force-dynamic";

function AuthenticatedResources() {
  useEffect(() => {
    document.title = "Resources | Blog Proto";
  }, []);
  const [query, setQuery] = useState("");
  const role = useRole();

  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6 flex-1">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-pretty">Resources</h1>
            <p className="text-muted-foreground">
              Browse and search available resources.
            </p>
          </div>
          {canManageContent(role) ? (
            <Button asChild>
              <Link href="/resources/new">Add Resource</Link>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search resources by title or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search resources"
          />
          <Button variant="secondary" onClick={() => setQuery("")}>
            Clear
          </Button>
        </div>

        <ResourceList query={query} />
      </main>
    </div>
  );
}

function UnauthenticatedResources() {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6 flex-1">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-pretty">Resources</h1>
          <p className="text-muted-foreground">
            Please sign in to browse and search available resources.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedResources />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedResources />
      </Unauthenticated>
    </>
  );
}
