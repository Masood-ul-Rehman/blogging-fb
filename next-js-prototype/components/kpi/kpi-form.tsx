"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAddKpi } from "@/lib/store";
import type { KPIEntry } from "@/lib/mock-store";
import { useToast } from "@/components/ui/use-toast";
import { canAddKpi, type Role } from "@/lib/roles";

export function KpiForm({
  onAdded,
  role = "viewer" as Role,
}: {
  onAdded?: (e: KPIEntry) => void;
  role?: Role;
}) {
  const { toast } = useToast();
  const addKpi = useAddKpi();
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [metric, setMetric] = useState("Revenue");
  const [value, setValue] = useState<number>(0);
  const allowed = canAddKpi(role);

  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access. Ask an admin to grant editor permissions to
        add KPI entries.
      </p>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const added = await addKpi({
          date,
          metric: metric.trim(),
          value: Number(value),
        });
        onAdded?.(added as any);
        toast({
          title: "KPI added",
          description: `${metric} on ${date} recorded.`,
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="metric">Metric</Label>
        <Input
          id="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          placeholder="e.g., Revenue"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          step="any"
          min="0"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add KPI</Button>
      </div>
    </form>
  );
}
