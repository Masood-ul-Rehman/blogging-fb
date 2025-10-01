"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PerformanceData {
  date?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  metric: "impressions" | "clicks" | "spend" | "ctr";
  title: string;
  description?: string;
}

export function PerformanceChart({
  data,
  metric,
  title,
  description,
}: PerformanceChartProps) {
  // Transform data for the chart
  const chartData = data.map((item, index) => ({
    name: item.date || `Day ${index + 1}`,
    value: parseFloat(item[metric] || "0"),
  }));

  const formatValue = (value: number) => {
    if (metric === "spend") {
      return `$${value.toFixed(2)}`;
    }
    if (metric === "ctr") {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  const getColor = () => {
    switch (metric) {
      case "impressions":
        return "#8b5cf6"; // Purple
      case "clicks":
        return "#3b82f6"; // Blue
      case "spend":
        return "#ef4444"; // Red
      case "ctr":
        return "#10b981"; // Green
      default:
        return "#6366f1";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "currentColor" }}
                tickFormatter={formatValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number) => [formatValue(value), title]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={getColor()}
                strokeWidth={2}
                dot={{ fill: getColor(), r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
