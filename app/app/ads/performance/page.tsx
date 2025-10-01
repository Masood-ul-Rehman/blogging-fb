"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdAccountSelector } from "@/components/ads/ad-account-selector";
import { PerformanceChart } from "@/components/ads/performance-chart";
import { AdsTable } from "@/components/ads/ads-table";
import { TokenStatus } from "@/components/ads/token-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

type DatePreset = "last_7d" | "last_14d" | "last_30d" | "lifetime";

export default function AdsPerformancePage() {
  const searchParams = useSearchParams();
  const adAccounts = useQuery(api.facebook.queries.getAdAccounts) || [];

  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last_7d");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchInsights = useAction(api.facebook.actions.fetchAdAccountInsights);
  const fetchCampaignInsights = useAction(
    api.facebook.actions.fetchCampaignInsights
  );

  // Set initial account from URL or first account
  useEffect(() => {
    const accountParam = searchParams.get("account");
    if (accountParam && adAccounts.some((acc) => acc.id === accountParam)) {
      setSelectedAccount(accountParam);
    } else if (adAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(adAccounts[0].id);
    }
  }, [searchParams, adAccounts, selectedAccount]);

  // Fetch data when account or date changes
  useEffect(() => {
    if (selectedAccount) {
      loadData();
    }
  }, [selectedAccount, datePreset]);

  const loadData = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      // Fetch account-level insights
      const [accountInsights, campaignInsights] = await Promise.all([
        fetchInsights({ adAccountId: selectedAccount, datePreset }),
        fetchCampaignInsights({ adAccountId: selectedAccount, datePreset }),
      ]);

      setInsights(accountInsights);
      setCampaigns(campaignInsights);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    toast.success("Data refreshed");
  };

  // Calculate summary metrics
  const totalImpressions = campaigns.reduce(
    (sum, c) => sum + parseFloat(c.impressions || "0"),
    0
  );
  const totalClicks = campaigns.reduce(
    (sum, c) => sum + parseFloat(c.clicks || "0"),
    0
  );
  const totalSpend = campaigns.reduce(
    (sum, c) => sum + parseFloat(c.spend || "0"),
    0
  );
  const avgCTR =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  if (adAccounts.length === 0) {
    return (
      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ad Performance</h1>
          <p className="text-muted-foreground">
            View detailed performance metrics for your ad campaigns
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <TokenStatus />
          </div>
        </div>
      </main>
    );
  }

  const selectedAccountData = adAccounts.find(
    (acc) => acc.id === selectedAccount
  );

  return (
    <main className="container mx-auto py-8 px-4 flex-1">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Ad Performance</h1>
        <p className="text-muted-foreground">
          View detailed performance metrics for your ad campaigns
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select ad account and date range to view performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <AdAccountSelector
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            />

            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select
                value={datePreset}
                onValueChange={(value) => setDatePreset(value as DatePreset)}
              >
                <SelectTrigger id="date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7d">Last 7 days</SelectItem>
                  <SelectItem value="last_14d">Last 14 days</SelectItem>
                  <SelectItem value="last_30d">Last 30 days</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedAccountData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selected Account:</p>
              <p className="text-sm text-muted-foreground">
                {selectedAccountData.name} ({selectedAccountData.currency})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalImpressions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 mb-6 lg:grid-cols-2">
        <PerformanceChart
          data={campaigns}
          metric="impressions"
          title="Impressions"
          description="Number of times your ads were shown"
        />
        <PerformanceChart
          data={campaigns}
          metric="clicks"
          title="Clicks"
          description="Number of clicks on your ads"
        />
        <PerformanceChart
          data={campaigns}
          metric="spend"
          title="Spend"
          description="Total amount spent on ads"
        />
        <PerformanceChart
          data={campaigns}
          metric="ctr"
          title="CTR"
          description="Click-through rate"
        />
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
          <CardDescription>Performance breakdown by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <AdsTable
            campaigns={campaigns}
            adAccountId={selectedAccount}
            onRefresh={loadData}
          />
        </CardContent>
      </Card>
    </main>
  );
}
