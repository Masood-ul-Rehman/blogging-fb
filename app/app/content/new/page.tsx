"use client";

import { useEffect } from "react";
import { ContentForm } from "@/components/content/content-form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/access/auth-guard";
import { useRole, canCreateContent } from "@/lib/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function NewContentPage() {
  useEffect(() => {
    document.title = "Add Content | Blog Proto";
  }, []);
  const role = useRole();
  const canCreate = canCreateContent(role);

  return (
    <AuthGuard showNavigation={false}>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6 flex-1">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Add Content</h1>
          <p className="text-muted-foreground">Create a new content item.</p>
        </div>

        {!canCreate ? (
          <Alert>
            <AlertTitle>View-only access</AlertTitle>
            <AlertDescription>
              You do not have permission to add content. Contact an{" "}
              <Badge variant="secondary">admin</Badge> to request the{" "}
              <Badge variant="secondary">manager</Badge> role.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>
                Enter information about the new content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentForm />
            </CardContent>
          </Card>
        )}
      </main>
    </AuthGuard>
  );
}
