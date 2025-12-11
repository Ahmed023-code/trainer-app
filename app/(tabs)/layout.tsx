"use client";
import Link from "next/link";
import { ReactNode, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import OnboardingCheck from "@/components/OnboardingCheck";
// Initialize storage and run migration
import "@/stores/storageV2";
import { DesignBackdrop, DesignVariantSwitcher, useDesignVariant } from "@/components/ui/DesignVariants";

function IconMask({ src, size = 22, className = "" }: { src: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

export default function TabsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { key: "home",     label: "Home",     href: "/",         color: "var(--accent-home)", icon: "/icons/fi-sr-home.svg" },
    { key: "diet",     label: "Diet",     href: "/diet",     color: "var(--accent-diet)", icon: "/icons/fi-sr-fork.svg" },
    { key: "workout",  label: "Workout",  href: "/workout",  color: "var(--accent-workout)", icon: "/icons/fi-sr-dumbbell-ray.svg" },
    { key: "schedule", label: "Progress", href: "/schedule", color: "var(--accent-progress)", icon: "/icons/fi-sr-calendar-clock.svg" },
    { key: "settings", label: "Settings", href: "/settings", color: "#9CA3AF", icon: "/icons/fi-sr-settings.svg" },
  ] as const;

  const { variant, setVariant } = useDesignVariant();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.design = variant;
    }
  }, [variant]);

  const active = useMemo(() => {
    if (pathname.startsWith("/diet")) return "diet" as const;
    if (pathname.startsWith("/workout")) return "workout" as const;
    if (pathname.startsWith("/schedule")) return "schedule" as const;
    if (pathname.startsWith("/settings")) return "settings" as const;
    return "home" as const;
  }, [pathname]);

  const navTheme = useMemo(() => {
    switch (variant) {
      case "glass":
        return {
          container:
            "bg-white/15 dark:bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.35)]",
          activeItem: "bg-white/30 dark:bg-white/15 border border-white/30",
          inactiveItem: "bg-white/10 dark:bg-white/5 border border-white/10",
          activeText: "text-white",
          inactiveText: "text-white/70",
        } as const;
      case "noir":
        return {
          container:
            "bg-[#0b0f1a]/90 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl",
          activeItem: "bg-gradient-to-r from-fuchsia-500/40 via-emerald-400/30 to-blue-500/40 border border-white/20",
          inactiveItem: "bg-white/5 border border-white/10",
          activeText: "text-white",
          inactiveText: "text-white/60",
        } as const;
      default:
        return {
          container:
            "bg-neutral-100 dark:bg-neutral-800 shadow-[0_-4px_12px_rgba(0,0,0,0.1),0_4px_12px_rgba(255,255,255,0.7)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.5),0_4px_12px_rgba(255,255,255,0.05)]",
          activeItem:
            "bg-neutral-200 dark:bg-neutral-700 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]",
          inactiveItem:
            "shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05),inset_-1px_-1px_2px_rgba(255,255,255,0.5)] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]",
          activeText: "text-black dark:text-white",
          inactiveText: "text-neutral-500 dark:text-neutral-400",
        } as const;
    }
  }, [variant]);

  // CHANGE: Added safe-area support and responsive container
  return (
    <div className="relative min-h-dvh overflow-hidden pb-[calc(env(safe-area-inset-bottom)+112px)]">
      <DesignBackdrop variant={variant} />
      <DesignVariantSwitcher variant={variant} onChange={setVariant} />
      <OnboardingCheck />
      <div className="pointer-events-none select-none relative z-10">{children}</div>
      <nav className="fixed inset-x-0 bottom-4 z-[100] flex justify-center pointer-events-none">
        <ul className={`pointer-events-auto max-w-md w-[92%] h-16 px-2 flex items-center gap-1 rounded-full ${navTheme.container}`}>
          {tabs.map(t => {
            const isActive = active === t.key;
            const text = isActive ? navTheme.activeText : navTheme.inactiveText;
            return (
              <li key={t.href} className="flex-1">
                <Link href={t.href} className="block">
                  <span
                    className={`flex flex-col items-center justify-center rounded-full py-2 transition-all duration-200 ${
                      isActive ? navTheme.activeItem : navTheme.inactiveItem
                    }`}
                    style={isActive ? { backgroundColor: t.color } : undefined}
                  >
                    <IconMask src={t.icon} className={text} />
                    <span className={`mt-1 text-[11px] ${text}`}>{t.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}