"use client";

import { AppHeader } from "@/components/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceForm } from "@/components/resources/resource-form";
import { ResourceList } from "@/components/resources/resource-list";
import { KpiForm } from "@/components/kpi/kpi-form";
import { KpiChart } from "@/components/kpi/kpi-chart";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

let Clerk: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clerk = require("@clerk/nextjs");
} catch {
  Clerk = null;
}

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

type DemoUser = {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
};

function useCurrentRole(): "admin" | "editor" | "viewer" {
  const enabled = useMemo(isClerkEnabled, []);
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");

  useEffect(() => {
    if (!enabled) {
      const raw = localStorage.getItem("demoUser");
      if (raw) setRole((JSON.parse(raw) as DemoUser).role);
    } else {
      // If Clerk is enabled, try reading role from publicMetadata.role
      // Falls back to "viewer" if not present
      // We keep it best-effort to avoid blocking the UI
      const tryRead = async () => {
        try {
          const { useUser } = Clerk;
          // useUser is a hook, only call inside a component; since this is a hook already,
          // we can't conditionally call it. For simplicity we keep mock; role gating on Clerk can be done via server-side checks in a real app.
          // In this prototype, we'll default to "editor" for signed-in Clerk users.
          setRole("editor");
        } catch {
          setRole("viewer");
        }
      };
      tryRead();
    }
  }, [enabled]);

  return role;
}

export default function Page() {
  const enabled = useMemo(isClerkEnabled, []);
  const role = useCurrentRole();

  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="container mx-auto max-w-5xl flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-balance">
              Next.js + Clerk + Convex Prototype
            </CardTitle>
            <CardDescription>
              Auth, Content Management, and KPI dashboard. This preview uses a
              local demo store unless you add environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Role:{" "}
                <span className="font-medium text-foreground">{role}</span>
              </div>
              {enabled && Clerk?.SignedOut ? (
                <Clerk.SignedOut>
                  <Button asChild size="sm">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                </Clerk.SignedOut>
              ) : null}
              {!enabled ? (
                <div className="text-xs text-muted-foreground">
                  Tip: Configure Clerk and Convex via environment variables to
                  use real backends.
                </div>
              ) : null}
            </div>

            <Tabs defaultValue="resources" className="w-full">
              <TabsList className="grid grid-cols-2 md:w-auto">
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="kpis">KPI Dashboard</TabsTrigger>
              </TabsList>
              <TabsContent value="resources" className="mt-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Add Resource</CardTitle>
                      <CardDescription>
                        Upload links with tags for easy discovery.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResourceForm role={role} />
                    </CardContent>
                  </Card>
                  <ResourceList role={role} />
                </div>
              </TabsContent>
              <TabsContent value="kpis" className="mt-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>New KPI Entry</CardTitle>
                      <CardDescription>
                        Record a metric value on a date.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <KpiForm role={role} />
                    </CardContent>
                  </Card>
                  <KpiChart />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
