"use client";

import { useEffect } from "react";
import { ResourceForm } from "@/components/resources/resource-form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/access/auth-guard";
import { useRole, canCreateResources } from "@/lib/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function NewResourcePage() {
  useEffect(() => {
    document.title = "Add Resource | Blog Proto";
  }, []);
  const role = useRole();
  const canCreate = canCreateResources(role);

  return (
    <AuthGuard showNavigation={false}>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6 flex-1">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Add Resource</h1>
          <p className="text-muted-foreground">
            Create a new content resource.
          </p>
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
              <CardTitle>Resource Details</CardTitle>
              <CardDescription>
                Enter information about the new resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceForm />
            </CardContent>
          </Card>
        )}
      </main>
    </AuthGuard>
  );
}
