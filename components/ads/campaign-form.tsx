"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface CampaignFormData {
  name: string;
  objective: string;
  budgetType: "daily" | "lifetime";
}

interface CampaignFormProps {
  data: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
}

const OBJECTIVES = [
  {
    value: "OUTCOME_TRAFFIC",
    label: "Traffic - Drive traffic to your website",
  },
  {
    value: "OUTCOME_ENGAGEMENT",
    label: "Engagement - Get more post engagement",
  },
  { value: "OUTCOME_LEADS", label: "Leads - Collect leads for your business" },
  { value: "OUTCOME_AWARENESS", label: "Awareness - Increase brand awareness" },
  { value: "OUTCOME_SALES", label: "Sales - Drive sales on your website" },
  {
    value: "OUTCOME_APP_PROMOTION",
    label: "App Promotion - Get more app installs",
  },
];

export function CampaignForm({ data, onChange }: CampaignFormProps) {
  const handleChange = (field: keyof CampaignFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="campaign-name">
          Campaign Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="campaign-name"
          placeholder="e.g., Summer Sale 2025"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          maxLength={256}
        />
        <p className="text-xs text-muted-foreground">
          Choose a descriptive name for your campaign (max 256 characters)
        </p>
      </div>

      {/* Campaign Objective */}
      <div className="space-y-2">
        <Label htmlFor="objective">
          Campaign Objective <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.objective}
          onValueChange={(value) => handleChange("objective", value)}
        >
          <SelectTrigger id="objective">
            <SelectValue placeholder="Select campaign objective" />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIVES.map((obj) => (
              <SelectItem key={obj.value} value={obj.value}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {obj.label.split(" - ")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {obj.label.split(" - ")[1]}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select what you want to achieve with this campaign
        </p>
      </div>

      {/* Budget Type */}
      <div className="space-y-2">
        <Label>
          Budget Type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={data.budgetType}
          onValueChange={(value) =>
            handleChange("budgetType", value as "daily" | "lifetime")
          }
          className="flex flex-col space-y-3"
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="daily" id="daily" />
            <div className="flex-1">
              <Label htmlFor="daily" className="cursor-pointer">
                Daily Budget
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Set a maximum amount to spend per day. Your campaign will run
                continuously.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="lifetime" id="lifetime" />
            <div className="flex-1">
              <Label htmlFor="lifetime" className="cursor-pointer">
                Lifetime Budget
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Set a total budget for the entire campaign duration. Requires
                start and end dates.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> Daily budget is recommended for ongoing
          campaigns. Lifetime budget works best for time-limited promotions.
        </p>
      </div>
    </div>
  );
}
