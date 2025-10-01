"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { FeatureCards } from "@/components/marketing/feature-cards";
import { Logos } from "@/components/marketing/logos";
import { SiteFooter } from "@/components/marketing/site-footer";

// Check if Clerk is enabled
function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

// Auth-aware CTA buttons component
export function AuthAwareCTAButtons({
  size = "default",
}: {
  size?: "default" | "lg";
}) {
  const clerkEnabled = isClerkEnabled();

  // Only use Clerk hooks if enabled
  let isSignedIn = false;
  let isLoaded = true;

  if (clerkEnabled) {
    const auth = useAuth();
    isSignedIn = auth.isSignedIn || false;
    isLoaded = auth.isLoaded;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild size={size}>
          <Link href="/app/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild size={size} variant="outline">
          <Link href="/app/content">Manage Content</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild size={size}>
        <Link href="/sign-up">Get started — it's free</Link>
      </Button>
      <Button asChild size={size} variant="outline">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}

// Auth-aware Hero component
function AuthAwareHero() {
  return (
    <section className="container mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="aspect-[16/10] md:order-1 bg-muted rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">Dashboard Preview</p>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
            Get to know your customers with forms worth filling out
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Collect the data you need to understand customers and turn insights
            into action. Build forms, organize content, and visualize content
            metrics in minutes.
          </p>
          <AuthAwareCTAButtons size="lg" />
          <p className="text-xs text-muted-foreground">
            No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AuthAwareLandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <AuthAwareHero />
        <section className="container mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
          <Logos />
        </section>
        <section className="container mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
          <FeatureCards />
          <div className="mt-10">
            <AuthAwareCTAButtons />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
