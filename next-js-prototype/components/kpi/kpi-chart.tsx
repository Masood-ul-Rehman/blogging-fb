"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useKpis } from "@/lib/store";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";

export function KpiChart() {
  const [metricFilter, setMetricFilter] = useState("Revenue");
  const { data: kpis, isLoading } = useKpis(metricFilter);

  const data = useMemo(() => {
    return kpis.map((k) => ({ date: k.date, value: k.value }));
  }, [kpis]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>KPI Trend</CardTitle>
        <CardDescription>
          Enter data then visualize it by metric
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="max-w-xs">
          <Input
            placeholder="Metric filter"
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="h-[320px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              value: { label: "Value", color: "hsl(var(--chart-1))" },
            }}
            className="h-[320px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
