"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Target,
  DollarSign,
  Calendar,
  Users,
  Globe,
  TrendingUp,
  FileImage,
  Link as LinkIcon,
  MousePointer,
} from "lucide-react";
import { CampaignFormData } from "./campaign-form";
import { AdSetFormData } from "./adset-form";
import { CreativeFormData } from "./creative-form";

interface ReviewStepProps {
  campaign: CampaignFormData;
  adSet: AdSetFormData;
  creative: CreativeFormData;
  status: "ACTIVE" | "PAUSED";
  onStatusChange: (status: "ACTIVE" | "PAUSED") => void;
  currency: string;
  pages: Array<{ id: string; name: string }>;
}

export function ReviewStep({
  campaign,
  adSet,
  creative,
  status,
  onStatusChange,
  currency,
  pages,
}: ReviewStepProps) {
  const selectedPage = pages.find((p) => p.id === creative.pageId);

  const getObjectiveLabel = (value: string) => {
    const objectives: Record<string, string> = {
      OUTCOME_TRAFFIC: "Traffic",
      OUTCOME_ENGAGEMENT: "Engagement",
      OUTCOME_LEADS: "Leads",
      OUTCOME_AWARENESS: "Awareness",
      OUTCOME_SALES: "Sales",
      OUTCOME_APP_PROMOTION: "App Promotion",
    };
    return objectives[value] || value;
  };

  const getOptimizationLabel = (value: string) => {
    const goals: Record<string, string> = {
      LINK_CLICKS: "Link Clicks",
      IMPRESSIONS: "Impressions",
      REACH: "Reach",
      LANDING_PAGE_VIEWS: "Landing Page Views",
      POST_ENGAGEMENT: "Post Engagement",
      OFFSITE_CONVERSIONS: "Conversions",
    };
    return goals[value] || value;
  };

  const getCTALabel = (value: string) => {
    return value
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Status Toggle */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="status" className="text-base">
                Launch Ad Immediately
              </Label>
              <p className="text-sm text-muted-foreground">
                {status === "ACTIVE"
                  ? "Ad will be active and running immediately after creation"
                  : "Ad will be created but paused. You can activate it later."}
              </p>
            </div>
            <Switch
              id="status"
              checked={status === "ACTIVE"}
              onCheckedChange={(checked) =>
                onStatusChange(checked ? "ACTIVE" : "PAUSED")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">
              Campaign Name:
            </span>
            <span className="text-sm font-medium text-right">
              {campaign.name}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Objective:</span>
            <Badge variant="outline">
              {getObjectiveLabel(campaign.objective)}
            </Badge>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Budget Type:</span>
            <Badge variant="secondary">
              {campaign.budgetType === "daily"
                ? "Daily Budget"
                : "Lifetime Budget"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ad Set Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Ad Set Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Ad Set Name:</span>
            <span className="text-sm font-medium text-right">{adSet.name}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget:
            </span>
            <span className="text-sm font-medium">
              {currency} {adSet.budgetAmount.toFixed(2)}{" "}
              {campaign.budgetType === "daily" ? "per day" : "total"}
            </span>
          </div>
          {adSet.startDate && adSet.endDate && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule:
              </span>
              <span className="text-sm font-medium text-right">
                {adSet.startDate} to {adSet.endDate}
              </span>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Optimization:</span>
            <span className="text-sm font-medium">
              {getOptimizationLabel(adSet.optimizationGoal)}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Billing:</span>
            <span className="text-sm font-medium">{adSet.billingEvent}</span>
          </div>
        </CardContent>
      </Card>

      {/* Targeting Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Audience Targeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Age Range:</span>
            <span className="text-sm font-medium">
              {adSet.targeting.ageMin} -{" "}
              {adSet.targeting.ageMax === 65 ? "65+" : adSet.targeting.ageMax}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Gender:</span>
            <span className="text-sm font-medium">
              {adSet.targeting.genders?.length === 2 ||
              adSet.targeting.genders?.length === 0
                ? "All"
                : adSet.targeting.genders?.includes(1) &&
                  adSet.targeting.genders?.includes(2)
                ? "All"
                : adSet.targeting.genders?.includes(1)
                ? "Male"
                : "Female"}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Countries:
            </span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {adSet.targeting.countries?.map((country) => (
                <Badge key={country} variant="outline" className="text-xs">
                  {country}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creative Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileImage className="mr-2 h-5 w-5" />
            Ad Creative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">
              Facebook Page:
            </span>
            <span className="text-sm font-medium text-right">
              {selectedPage?.name || "Not selected"}
            </span>
          </div>

          {/* Image Preview */}
          {creative.imagePreview && (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={creative.imagePreview}
                alt="Ad preview"
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          <div className="space-y-3 pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Primary Text:
              </p>
              <p className="text-sm">{creative.message}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Headline:</p>
              <p className="text-sm font-medium">{creative.headline}</p>
            </div>
            {creative.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description:
                </p>
                <p className="text-sm">{creative.description}</p>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center">
                <LinkIcon className="h-4 w-4 mr-1" />
                Link:
              </span>
              <a
                href={creative.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline max-w-[70%] truncate"
              >
                {creative.linkUrl}
              </a>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground flex items-center">
                <MousePointer className="h-4 w-4 mr-1" />
                Call to Action:
              </span>
              <Badge>{getCTALabel(creative.callToAction)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Box */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          ⚠️ <strong>Please Review Carefully:</strong> Once you click "Create
          Ad", this ad will be submitted to Facebook. Make sure all information
          is correct.
          {status === "ACTIVE" &&
            " The ad will start running immediately and may incur charges."}
        </p>
      </div>
    </div>
  );
}
