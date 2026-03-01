"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingProvider } from "@/components/onboarding/onboarding-tour";
import { CopilotContainer } from "@/components/ai-copilot/copilot-container";
import { CopilotTrigger } from "@/components/ai-copilot/copilot-trigger";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-mesh-light dark:bg-mesh-dark">
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r bg-card/50 backdrop-blur-xl lg:block">
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>
      <div className="lg:pl-[260px]">
        <div className="h-16 border-b bg-card/50 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <main className="p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check localStorage directly first (faster than waiting for hydration)
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      router.push("/login");
      return;
    }

    // Token exists, verify it's still valid
    const verifyAuth = async () => {
      const valid = await checkAuth();
      if (!valid) {
        router.push("/login");
      }
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth, router]);

  // Show loading while checking auth
  if (isChecking) {
    return <LoadingSkeleton />;
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-mesh-light dark:bg-mesh-dark">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="lg:pl-[260px] transition-all duration-300">
          {/* Header with mobile nav */}
          <div className="sticky top-0 z-30 flex items-center gap-2 lg:block">
            <div className="flex items-center gap-2 px-4 py-2 lg:hidden">
              <MobileNav />
            </div>
            <div className="flex-1">
              <Header />
            </div>
          </div>
          <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">{children}</main>
        </div>

        {process.env.NEXT_PUBLIC_ENABLE_AI_COPILOT === "true" && (
          <>
            <CopilotContainer />
            <CopilotTrigger />
          </>
        )}
      </div>
    </OnboardingProvider>
  );
}
