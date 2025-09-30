"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAddResource } from "@/lib/store";
import type { Resource } from "@/lib/mock-store";
import { canCreateResources, type Role } from "@/lib/roles";

type Props = {
  role: Role;
  onAdded?: (r: Resource) => void;
};

export function ResourceForm({ role, onAdded }: Props) {
  const canCreate = canCreateResources(role);
  const { toast } = useToast();
  const addResource = useAddResource();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  if (!canCreate) {
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access. Ask an admin to grant editor permissions to
        add resources.
      </p>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const resource = await addResource({
            title: title.trim(),
            url: url.trim(),
            description: description.trim() || undefined,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          });
          setTitle("");
          setUrl("");
          setDescription("");
          setTags("");
          toast({
            title: "Resource added",
            description: "Your resource was saved.",
          });
          onAdded?.(resource as any);
        } catch (err: any) {
          toast({
            title: "Error",
            description: err?.message || "Failed to add resource",
          });
        }
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Awesome article"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Short summary"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="nextjs, auth, cms"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add Resource</Button>
      </div>
    </form>
  );
}
