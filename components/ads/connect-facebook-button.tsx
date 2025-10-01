"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { useState } from "react";

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

// Get redirect URI from environment or construct it
const REDIRECT_URI = (() => {
  // First try environment variable
  if (process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;
  }

  // Fallback to constructing from current origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/facebook/callback`;
  }

  // Server-side fallback (should not happen in client component)
  return "";
})();

// Scopes needed for Facebook Marketing API
const SCOPES = [
  "ads_read", // Read ads data
  "ads_management", // Manage ads (pause/resume/edit)
  "business_management", // Access to business assets
  "pages_show_list", // List pages
].join(",");

export function ConnectFacebookButton() {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!FACEBOOK_APP_ID) {
      alert(
        "Facebook App ID is not configured. Please check your environment variables."
      );
      return;
    }

    if (!user) {
      alert("Please sign in first");
      return;
    }

    if (!REDIRECT_URI) {
      alert(
        "Redirect URI is not configured. Please check your environment variables."
      );
      return;
    }

    setIsConnecting(true);

    // Generate state parameter for CSRF protection
    // In production, this should be a cryptographically random value
    // stored in a secure cookie or session
    const state = `${user.id}_${Date.now()}`;

    // Debug logging
    console.log("Facebook OAuth Debug Info:", {
      appId: FACEBOOK_APP_ID,
      redirectUri: REDIRECT_URI,
      state,
      scopes: SCOPES,
    });

    // Build Facebook OAuth URL
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: REDIRECT_URI,
      state,
      scope: SCOPES,
      response_type: "code",
      auth_type: "rerequest", // Force re-authentication if needed
    });

    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
    console.log("Facebook OAuth URL:", authUrl);

    // Redirect to Facebook OAuth
    window.location.href = authUrl;
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="lg"
      className="bg-[#1877F2] hover:bg-[#1565C0] text-white"
    >
      <Facebook className="mr-2 h-5 w-5" />
      {isConnecting ? "Connecting..." : "Connect Facebook"}
    </Button>
  );
}
