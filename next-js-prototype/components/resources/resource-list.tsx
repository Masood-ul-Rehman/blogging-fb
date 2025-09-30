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
import { useResources, useDeleteResource } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { canDeleteResources, type Role } from "@/lib/roles";

export function ResourceList({ role }: { role: Role }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const { data: items, isLoading } = useResources(query, tag);
  const deleteResource = useDeleteResource();

  const canDelete = canDeleteResources(role);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((r) => r.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search resources..."
          value={query}
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
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resources yet.</p>
        ) : (
          items.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-pretty text-balance">
                  {r.title}
                </CardTitle>
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
                    onClick={async () => {
                      await deleteResource(r.id);
                      // The query will automatically refetch
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
  );
}
