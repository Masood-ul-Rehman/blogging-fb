import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};
import { AppHeader } from "@/components/app-header";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <SignUp
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
