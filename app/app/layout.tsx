import { AppHeader } from "@/components/app-header";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      {children}
    </div>
  );
}
