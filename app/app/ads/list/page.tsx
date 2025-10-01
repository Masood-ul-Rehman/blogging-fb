"use client";

import { useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TokenStatus } from "@/components/ads/token-status";
import { ConnectFacebookButton } from "@/components/ads/connect-facebook-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function AdsListPage() {
  const searchParams = useSearchParams();
  const connection = useQuery(api.facebook.queries.getFacebookConnection);
  const adAccounts = useQuery(api.facebook.queries.getAdAccounts) || [];
  const fetchAdAccounts = useAction(api.facebook.actions.fetchAdAccounts);

  // Handle OAuth callback messages
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Facebook account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", "/app/ads/list");
    }

    if (error) {
      toast.error(decodeURIComponent(error));
      // Clean up URL
      window.history.replaceState({}, "", "/app/ads/list");
    }
  }, [searchParams]);

  const handleRefresh = async () => {
    try {
      toast.loading("Refreshing ad accounts...");
      await fetchAdAccounts({});
      toast.dismiss();
      toast.success("Ad accounts refreshed");
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to refresh: ${error.message}`);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 flex-1">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Facebook Ads Management</h1>
          <p className="text-muted-foreground">
            Connect your Facebook account and manage your ad campaigns
          </p>
        </div>
        {connection?.isActive && adAccounts.length > 0 && (
          <Link href="/app/ads/create">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Ad
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Connection status */}
        <div className="lg:col-span-1">
          <TokenStatus />
        </div>

        {/* Right column - Ad accounts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ad Accounts</CardTitle>
                  <CardDescription>
                    View and manage your Facebook ad accounts
                  </CardDescription>
                </div>
                {connection?.isActive && (
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!connection ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    Connect your Facebook account to view your ad accounts
                  </p>
                  <ConnectFacebookButton />
                </div>
              ) : adAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No ad accounts found. Make sure your Facebook account has
                    access to ad accounts.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {adAccounts.map((account) => (
                    <Card key={account.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {account.name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                ID: {account.accountId}
                              </Badge>
                              <Badge variant="outline">
                                {account.currency}
                              </Badge>
                              <Badge variant="outline">
                                {account.timezone}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Link
                            href={`/app/ads/performance?account=${encodeURIComponent(
                              account.id
                            )}`}
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Performance
                            </Button>
                          </Link>
                          <Link href="/app/ads/create" className="flex-1">
                            <Button className="w-full">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Ad
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" asChild>
                            <a
                              href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${account.accountId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
