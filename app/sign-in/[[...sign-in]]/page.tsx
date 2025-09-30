import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};
import { AppHeader } from "@/components/app-header";

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <SignIn
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
