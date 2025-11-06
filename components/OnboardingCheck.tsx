"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function OnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if we're already in the onboarding flow
    if (pathname?.startsWith("/onboarding")) {
      return;
    }

    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem("onboarding-completed");

    if (!onboardingCompleted) {
      // Redirect to onboarding
      router.push("/onboarding");
    }
  }, [pathname, router]);

  return null;
}
