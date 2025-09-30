"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

let ClerkSignIn: any = null
try {
  // Dynamic require guarded by env to avoid SSR import issues if Clerk not installed/configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ClerkSignIn = require("@clerk/nextjs").SignIn
} catch (_) {
  ClerkSignIn = null
}

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}

export default function Page() {
  const enabled = useMemo(isClerkEnabled, [])
  const router = useRouter()

  // Demo fallback state
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("admin")

  useEffect(() => {
    // If already "logged in" via demo, redirect
    if (typeof window !== "undefined") {
      const demo = localStorage.getItem("demoUser")
      if (demo) router.replace("/")
    }
  }, [router])

  if (enabled && ClerkSignIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ClerkSignIn
            appearance={{ variables: { colorPrimary: "oklch(var(--color-primary))" } }}
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in (Demo)</CardTitle>
          <CardDescription>
            Clerk is not configured. Continue with a demo user. You can set a role to test permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button
            onClick={() => {
              localStorage.setItem("demoUser", JSON.stringify({ id: "demo", email: email || "demo@example.com", role }))
              router.replace("/")
            }}
          >
            Continue
          </Button>
          <p className="text-xs text-muted-foreground">
            Need an account?{" "}
            <Link className="underline" href="/sign-up">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
