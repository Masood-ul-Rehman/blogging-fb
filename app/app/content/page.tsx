"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ContentList } from "@/components/content/content-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRole, canManageContent } from "@/lib/roles";
import { Authenticated, Unauthenticated } from "convex/react";

export const dynamic = "force-dynamic";

function AuthenticatedContent() {
  useEffect(() => {
    document.title = "Content | Blog Proto";
  }, []);
  const [query, setQuery] = useState("");
  const role = useRole();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6 flex-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-pretty">Content</h1>
          <p className="text-muted-foreground">
            Browse and search available content.
          </p>
        </div>
        {canManageContent(role) ? (
          <Button asChild>
            <Link href="/app/content/new">Add Content</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search content by title or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search content"
            className="w-full md:w-80"
          />
        </div>
        <Button variant="secondary" onClick={() => setQuery("")}>
          Clear
        </Button>
      </div>

      <ContentList query={query} />
    </main>
  );
}

function UnauthenticatedContent() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6 flex-1">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold text-pretty">Content</h1>
        <p className="text-muted-foreground">
          Please sign in to browse and search available content.
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
  );
}

export default function ContentPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedContent />
      </Unauthenticated>
    </>
  );
}
