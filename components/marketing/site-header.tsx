"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/placeholder-logo.jpg"
            alt="Logo"
            width={24}
            height={24}
            className="rounded-sm"
          />
          <span className="font-semibold">FormKit</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="#content"
            className="text-muted-foreground hover:text-foreground"
          >
            Content
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!isLoaded ? (
            // Loading state
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          ) : isSignedIn ? (
            // Authenticated state
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/app/content">Content</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            // Unauthenticated state
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
