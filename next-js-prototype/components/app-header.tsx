"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"

let Clerk: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clerk = require("@clerk/nextjs")
} catch {
  Clerk = null
}

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}

type DemoUser = { id: string; email: string; role: "admin" | "editor" | "viewer" }

export function AppHeader() {
  const enabled = useMemo(isClerkEnabled, [])
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)

  useEffect(() => {
    if (!enabled) {
      const raw = localStorage.getItem("demoUser")
      setDemoUser(raw ? (JSON.parse(raw) as DemoUser) : null)
    }
  }, [enabled])

  return (
    <header className="border-b border-border">
      <div className="container mx-auto max-w-5xl flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/placeholder-logo.svg" alt="Logo" width={24} height={24} />
          <span className="font-medium">Prototype</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="text-sm px-3 py-1.5 rounded-md hover:bg-accent">
            Home
          </Link>
          {enabled && Clerk?.SignedIn ? (
            <>
              <Clerk.SignedIn>
                <Clerk.UserButton afterSignOutUrl="/" />
              </Clerk.SignedIn>
              <Clerk.SignedOut>
                <Button asChild variant="default">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </Clerk.SignedOut>
            </>
          ) : demoUser ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {demoUser.email} · {demoUser.role}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("demoUser")
                  location.href = "/"
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button asChild variant="default">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
