"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { type PropsWithChildren, useMemo } from "react";
import { isClerkEnabled, isConvexEnabled } from "@/lib/config";

export function Providers({ children }: PropsWithChildren) {
  const clerkEnabled = useMemo(isClerkEnabled, []);
  const convexEnabled = useMemo(isConvexEnabled, []);

  const content = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );

  let wrappedContent = content;

  // Wrap with ConvexProvider if enabled (dynamic import to avoid build issues)
  if (convexEnabled && typeof window !== "undefined") {
    try {
      const { ConvexProvider, ConvexReactClient } = require("convex/react");
      const convexClient = new ConvexReactClient(
        process.env.NEXT_PUBLIC_CONVEX_URL!
      );
      wrappedContent = (
        <ConvexProvider client={convexClient}>{wrappedContent}</ConvexProvider>
      );
    } catch (e) {
      console.warn("Convex not available, running in mock mode");
    }
  }

  // Wrap with ClerkProvider if enabled
  if (clerkEnabled) {
    wrappedContent = <ClerkProvider>{wrappedContent}</ClerkProvider>;
  }

  return wrappedContent;
}
