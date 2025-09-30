"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

let ClerkSignUp: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ClerkSignUp = require("@clerk/nextjs").SignUp
} catch (_) {
  ClerkSignUp = null
}

function isClerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}

export default function Page() {
  const enabled = useMemo(isClerkEnabled, [])
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (enabled && ClerkSignUp) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ClerkSignUp
            appearance={{ variables: { colorPrimary: "oklch(var(--color-primary))" } }}
            signInUrl="/sign-in"
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
          <CardTitle>Sign up (Demo)</CardTitle>
          <CardDescription>Create a demo user locally.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            onClick={() => {
              localStorage.setItem(
                "demoUser",
                JSON.stringify({ id: crypto.randomUUID(), email: email || "demo@example.com", role: "viewer" }),
              )
              // Simulate email verification redirect
              router.replace("/")
            }}
          >
            Create account
          </Button>
          <p className="text-xs text-muted-foreground">
            Have an account?{" "}
            <Link className="underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
