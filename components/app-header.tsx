"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRole, canManageContent } from "@/lib/roles";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/nextjs";

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

function AuthSection() {
  if (!isClerkEnabled()) {
    return (
      <Button asChild variant="default">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="default" size="sm">
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </SignedIn>
    </>
  );
}

function NavigationLinks() {
  const { isSignedIn } = useAuth();

  // Always call useRole to maintain hook order consistency
  const role = useRole();

  return (
    <>
      <Link
        href="/app/content"
        className="text-sm px-3 py-1.5 rounded-md hover:bg-accent"
      >
        Content
      </Link>
      {isSignedIn && (
        <Link
          href="/app/dashboard"
          className="text-sm px-3 py-1.5 rounded-md hover:bg-accent"
        >
          Dashboard
        </Link>
      )}
      {isSignedIn && (
        <Link
          href="/app/ads"
          className="text-sm px-3 py-1.5 rounded-md hover:bg-accent"
        >
          Ads
        </Link>
      )}
      {isSignedIn && canManageContent(role) && (
        <Button asChild variant="outline" size="sm">
          <Link href="/app/content/new">New</Link>
        </Button>
      )}
    </>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto max-w-5xl flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-mark.jpg" alt="Logo" width={24} height={24} />
          <span className="font-medium">Prototype</span>
        </Link>
        <nav className="flex items-center gap-2">
          <NavigationLinks />
          <AuthSection />
        </nav>
      </div>
    </header>
  );
}
