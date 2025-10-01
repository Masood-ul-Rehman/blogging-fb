"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AdAccountSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function AdAccountSelector({
  value,
  onValueChange,
}: AdAccountSelectorProps) {
  const adAccounts = useQuery(api.facebook.queries.getAdAccounts) || [];

  if (adAccounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No ad accounts available. Please connect your Facebook account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="ad-account">Ad Account</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="ad-account">
          <SelectValue placeholder="Select an ad account" />
        </SelectTrigger>
        <SelectContent>
          {adAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex flex-col">
                <span className="font-medium">{account.name}</span>
                <span className="text-xs text-muted-foreground">
                  {account.accountId} • {account.currency}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
