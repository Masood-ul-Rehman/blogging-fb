"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { canCreateResources, type Role, useRole } from "@/lib/roles";
import { useMutation } from "convex/react";
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

type Props = {
  role?: Role;
  onAdded?: (r: Resource) => void;
};

export function ResourceForm({ role: roleProp, onAdded }: Props) {
  const { toast } = useToast();
  const roleFromHook = useRole();
  const effectiveRole = (roleProp as Role | undefined) ?? roleFromHook;
  const canCreate = canCreateResources(effectiveRole);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addResource = useMutation(api.content.mutations.add);

  if (!canCreate) {
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access. Ask an admin to grant manager permissions to
        add resources.
      </p>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
          await addResource({
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
          onAdded?.({} as Resource);
        } catch (err: any) {
          toast({
            title: "Error",
            description: err?.message || "Failed to add resource",
          });
        } finally {
          setIsSubmitting(false);
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Resource"}
        </Button>
      </div>
    </form>
  );
}
