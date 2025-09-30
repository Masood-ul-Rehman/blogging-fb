"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canDeleteContent, type Role, useRole } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { api } from "@/convex/_generated/api";

type Content = {
  _id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdBy: string;
  _creationTime: number;
};

export function ContentList({
  role: roleProp,
  query: queryProp,
  limit,
  showControls,
}: {
  role?: Role;
  query?: string;
  limit?: number;
  showControls?: boolean;
}) {
  const [query, setQuery] = useState(queryProp ?? "");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const roleFromHook = useRole();
  const effectiveRole = (roleProp as Role | undefined) ?? roleFromHook;
  const controls = showControls ?? queryProp === undefined;
  const canDelete = canDeleteContent(effectiveRole);

  // Check if we have a valid Convex environment
  const hasValidConvex = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
      !process.env.NEXT_PUBLIC_CONVEX_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_CONVEX_URL.startsWith("https://")
  );

  const searchQuery = queryProp ?? query;
  const allContent = useQuery(
    api.content.queries.list,
    hasValidConvex
      ? {
          query: searchQuery || undefined,
          tag: tag || undefined,
        }
      : "skip"
  );
  const deleteContent = useMutation(api.content.mutations.remove);

  const items = useMemo(() => {
    if (!allContent) return [];
    return limit ? allContent.slice(0, limit) : allContent;
  }, [allContent, limit]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((c) => c.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  return (
    <>
      <Authenticated>
        <div className="grid gap-4">
          {controls ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:w-auto">
                <Input
                  placeholder="Search content..."
                  value={queryProp ?? query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full md:w-80"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={!tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTag(undefined)}
                >
                  All
                </Button>
                {allTags.map((t) => (
                  <Button
                    key={t}
                    variant={tag === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTag(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content yet.</p>
            ) : (
              items.map((c) => (
                <Card key={c._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-balance">{c.title}</CardTitle>
                    <CardDescription className="truncate">
                      <a
                        className="underline"
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {c.url}
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {c.description ? (
                        <p className="text-sm text-pretty">{c.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {canDelete ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          deleteContent({ id: c._id });
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Please sign in to view content.
          </p>
        </div>
      </Unauthenticated>
    </>
  );
}
