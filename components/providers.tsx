"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { type PropsWithChildren, useMemo } from "react";

export function Providers({ children }: PropsWithChildren) {
  // Use useMemo to ensure consistent values during hydration
  const { clerkEnabled, convexEnabled, convexUrl, clerkKey } = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

    // Check if values are placeholders or valid
    const isConvexValid =
      convexUrl &&
      !convexUrl.includes("placeholder") &&
      convexUrl.startsWith("https://");
    const isClerkValid =
      clerkKey &&
      !clerkKey.includes("placeholder") &&
      clerkKey.startsWith("pk_");

    return {
      clerkEnabled: Boolean(clerkKey) && isClerkValid,
      convexEnabled: Boolean(convexUrl) && isConvexValid,
      convexUrl,
      clerkKey,
    };
  }, []);

  // Create Convex client with useMemo to prevent recreation
  const convexClient = useMemo(() => {
    if (convexEnabled && convexUrl) {
      try {
        return new ConvexReactClient(convexUrl);
      } catch (error) {
        console.warn("Failed to create Convex client:", error);
        return null;
      }
    }
    return null;
  }, [convexEnabled, convexUrl]);

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );

  // If both Clerk and Convex are properly configured
  if (clerkEnabled && convexEnabled && convexClient && clerkKey) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          {content}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }

  // If only Clerk is configured
  if (clerkEnabled && clerkKey) {
    return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
  }

  // If only Convex is configured
  if (convexEnabled && convexClient) {
    return <ConvexProvider client={convexClient}>{content}</ConvexProvider>;
  }

  // Fallback: render with a mock ConvexProvider to prevent hook errors
  // This creates a mock client that will never actually connect
  const mockClient = useMemo(() => {
    try {
      // Create a mock client with a placeholder URL to satisfy the hooks
      return new ConvexReactClient("https://placeholder.convex.cloud");
    } catch (error) {
      console.warn("Failed to create mock Convex client:", error);
      return null;
    }
  }, []);

  if (mockClient) {
    return <ConvexProvider client={mockClient}>{content}</ConvexProvider>;
  }

  // Final fallback: render without providers (development mode)
  return content;
}
