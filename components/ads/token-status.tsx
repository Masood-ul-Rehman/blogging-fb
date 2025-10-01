"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, LogOut } from "lucide-react";
import { ConnectFacebookButton } from "./connect-facebook-button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function TokenStatus() {
  const connection = useQuery(api.facebook.queries.getFacebookConnection);
  const disconnectFacebook = useMutation(
    api.facebook.mutations.disconnectFacebook
  );

  const handleDisconnect = async () => {
    if (
      !confirm("Are you sure you want to disconnect your Facebook account?")
    ) {
      return;
    }

    try {
      await disconnectFacebook({});
      toast.success("Facebook account disconnected");
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Connection</CardTitle>
          <CardDescription>
            Connect your Facebook account to manage your ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <XCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              No Facebook account connected
            </p>
            <ConnectFacebookButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = Date.now();
  const isExpired = connection.expiresAt <= now;
  const isExpiringSoon = connection.expiresAt <= now + 7 * 24 * 60 * 60 * 1000; // 7 days
  const expiresInText = formatDistanceToNow(new Date(connection.expiresAt), {
    addSuffix: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Facebook Connection</span>
          {connection.isActive && !isExpired ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Inactive
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage your Facebook Marketing API connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Facebook User ID:</span>
            <span className="font-mono">{connection.fbUserId}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Connected:</span>
            <span>
              {formatDistanceToNow(new Date(connection.connectedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Synced:</span>
            <span>
              {formatDistanceToNow(new Date(connection.lastSyncedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Token Expires:</span>
            <div className="flex items-center gap-2">
              {isExpiringSoon && !isExpired && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className={isExpired ? "text-red-500 font-semibold" : ""}>
                {expiresInText}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ad Accounts:</span>
            <span className="font-semibold">
              {connection.adAccounts.length}
            </span>
          </div>
        </div>

        {(isExpired || !connection.isActive) && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  {isExpired ? "Token Expired" : "Connection Inactive"}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Please reconnect your Facebook account to continue managing
                  your ads.
                </p>
                <ConnectFacebookButton />
              </div>
            </div>
          </div>
        )}

        {connection.isActive && !isExpired && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Facebook
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
