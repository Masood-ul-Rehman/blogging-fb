"use client";

import { useEffect } from "react";
import { AuthGuard } from "@/components/access/auth-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContentList } from "@/components/content/content-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery, Authenticated, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function ContentMetrics() {
  const allContent = useQuery(api.content.queries.list, {});

  const metrics = useMemo(() => {
    if (!allContent) return null;

    // Total content
    const total = allContent.length;

    // New this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = allContent.filter(
      (c) => c._creationTime > oneWeekAgo
    ).length;

    // Tag distribution
    const tagCounts = new Map<string, number>();
    allContent.forEach((c) => {
      c.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTag =
      Array.from(tagCounts.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "—";

    // Content by day for chart
    const dailyCounts = new Map<string, number>();
    allContent.forEach((c) => {
      const date = new Date(c._creationTime).toISOString().split("T")[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    const chartData = Array.from(dailyCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, count]) => ({ date, count }));

    // Tag distribution for pie chart
    const tagData = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 tags
      .map(([tag, count], index) => ({
        tag,
        count,
        fill: `hsl(${(index * 360) / 5 + 200}, 60%, 60%)`,
      }));

    return {
      total,
      newThisWeek,
      topTag,
      chartData,
      tagData,
      totalTags: tagCounts.size,
    };
  }, [allContent]);

  if (!metrics) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <>
      <Authenticated>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Content</CardDescription>
              <CardTitle className="text-2xl">{metrics.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New This Week</CardDescription>
              <CardTitle className="text-2xl">{metrics.newThisWeek}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Top Tag</CardDescription>
              <CardTitle className="text-2xl">{metrics.topTag}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tags</CardDescription>
              <CardTitle className="text-2xl">{metrics.totalTags}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Content Creation</CardTitle>
              <CardDescription>
                Content added per day (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Content", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.chartData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tag Distribution</CardTitle>
              <CardDescription>Most popular content tags</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Count", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.tagData}
                      dataKey="count"
                      nameKey="tag"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ tag, count }) => `${tag}: ${count}`}
                    >
                      {metrics.tagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </Authenticated>
      <Unauthenticated>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Please sign in to view metrics</CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
        </section>
      </Unauthenticated>
    </>
  );
}

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard | Blog Proto";
  }, []);
  return (
    <AuthGuard showNavigation={false}>
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Content Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of content metrics and recent activity.
            </p>
          </div>
          <Button asChild>
            <Link href="/app/content/new">Add Content</Link>
          </Button>
        </div>

        <ContentMetrics />

        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>
              Latest content added to your collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentList limit={5} />
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
