"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface Campaign {
  campaign_id?: string;
  campaign_name?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  status?: string;
}

interface AdsTableProps {
  campaigns: Campaign[];
  adAccountId: string;
  onRefresh?: () => void;
}

export function AdsTable({ campaigns, adAccountId, onRefresh }: AdsTableProps) {
  const [loadingCampaign, setLoadingCampaign] = useState<string | null>(null);
  const updateAdStatus = useAction(api.facebook.actions.updateAdStatus);

  const handleToggleStatus = async (
    campaignId: string,
    campaignName: string,
    currentStatus?: string
  ) => {
    setLoadingCampaign(campaignId);

    try {
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

      await updateAdStatus({
        adId: campaignId,
        status: newStatus as "ACTIVE" | "PAUSED",
        adAccountId,
        adName: campaignName,
      });

      toast.success(
        `Campaign ${newStatus === "PAUSED" ? "paused" : "resumed"} successfully`
      );

      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      toast.error(`Failed to update campaign: ${error.message}`);
    } finally {
      setLoadingCampaign(null);
    }
  };

  const formatCurrency = (value?: string) => {
    if (!value) return "$0.00";
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatNumber = (value?: string) => {
    if (!value) return "0";
    return parseInt(value).toLocaleString();
  };

  const formatPercent = (value?: string) => {
    if (!value) return "0%";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No campaigns found for the selected date range.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const campaignId = campaign.campaign_id || "";
            const isLoading = loadingCampaign === campaignId;

            return (
              <TableRow key={campaignId}>
                <TableCell className="font-medium">
                  {campaign.campaign_name || "Untitled Campaign"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.impressions)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.clicks)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(campaign.spend)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(campaign.ctr)}
                </TableCell>
                <TableCell className="text-center">
                  {campaign.status && (
                    <Badge
                      variant={
                        campaign.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.status && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(
                          campaignId,
                          campaign.campaign_name || "",
                          campaign.status
                        )
                      }
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : campaign.status === "ACTIVE" ? (
                        <>
                          <Pause className="mr-1 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
