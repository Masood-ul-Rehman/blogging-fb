import { AuthAwareLandingPage } from "@/components/auth-aware-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Blog Proto - A modern content management platform",
};

export default function LandingPage() {
  return <AuthAwareLandingPage />;
}
