"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { canCreateContent, type Role, useRole } from "@/lib/roles";
import { useMutation } from "convex/react";
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

type Props = {
  role?: Role;
  onAdded?: (c: Content) => void;
};

export function ContentForm({ role: roleProp, onAdded }: Props) {
  const { toast } = useToast();
  const roleFromHook = useRole();
  const effectiveRole = (roleProp as Role | undefined) ?? roleFromHook;
  const canCreate = canCreateContent(effectiveRole);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addContent = useMutation(api.content.mutations.add);

  if (!canCreate) {
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access. Ask an admin to grant manager permissions to
        add content.
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
          await addContent({
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
            title: "Content added",
            description: "Your content was saved.",
          });
          onAdded?.({} as Content);
        } catch (err: any) {
          toast({
            title: "Error",
            description: err?.message || "Failed to add content",
          });
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <div className="w-full md:w-auto">
          <Input
            id="title"
            placeholder="Awesome article"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full md:w-80"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="url">URL</Label>
        <div className="w-full md:w-auto">
          <Input
            id="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full md:w-80"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <div className="w-full md:w-auto">
          <Textarea
            id="description"
            placeholder="Short summary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full md:w-96"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <div className="w-full md:w-auto">
          <Input
            id="tags"
            placeholder="nextjs, auth, cms"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full md:w-80"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Content"}
        </Button>
      </div>
    </form>
  );
}
