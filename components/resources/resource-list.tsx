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
import { canDeleteResources, type Role, useRole } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { api } from "@/convex/_generated/api";

type Resource = {
  _id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdBy: string;
  _creationTime: number;
};

export function ResourceList({
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
  const canDelete = canDeleteResources(effectiveRole);

  const searchQuery = queryProp ?? query;
  const allResources = useQuery(api.content.queries.list, {
    query: searchQuery || undefined,
    tag: tag || undefined,
  });
  const deleteResource = useMutation(api.content.mutations.remove);

  const items = useMemo(() => {
    if (!allResources) return [];
    return limit ? allResources.slice(0, limit) : allResources;
  }, [allResources, limit]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((r) => r.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  return (
    <>
      <Authenticated>
        <div className="grid gap-4">
          {controls ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Search resources..."
                value={queryProp ?? query}
                onChange={(e) => setQuery(e.target.value)}
                className="md:max-w-sm"
              />
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
              <p className="text-sm text-muted-foreground">No resources yet.</p>
            ) : (
              items.map((r) => (
                <Card key={r._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-balance">{r.title}</CardTitle>
                    <CardDescription className="truncate">
                      <a
                        className="underline"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.url}
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {r.description ? (
                        <p className="text-sm text-pretty">{r.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.tags.map((t) => (
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
                          deleteResource({ id: r._id });
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
            Please sign in to view resources.
          </p>
        </div>
      </Unauthenticated>
    </>
  );
}
