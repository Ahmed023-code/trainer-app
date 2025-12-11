"use client";
import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import OnboardingCheck from "@/components/OnboardingCheck";
// Initialize storage and run migration
import "@/stores/storageV2";

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

  const active = useMemo(() => {
    if (pathname.startsWith("/diet")) return "diet" as const;
    if (pathname.startsWith("/workout")) return "workout" as const;
    if (pathname.startsWith("/schedule")) return "schedule" as const;
    if (pathname.startsWith("/settings")) return "settings" as const;
    return "home" as const;
  }, [pathname]);

  // CHANGE: Added safe-area support and responsive container
  return (
    <div className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+112px)]">
      <OnboardingCheck />
      {children}
      <nav className="fixed inset-x-0 bottom-4 z-[100] flex justify-center pointer-events-none">
        <ul className="pointer-events-auto max-w-md w-[92%] h-16 px-2 flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 shadow-[0_-9px_18px_rgba(0,0,0,0.2),0_9px_18px_rgba(255,255,255,0.9)] dark:shadow-[0_-9px_18px_rgba(0,0,0,0.6),0_9px_18px_rgba(255,255,255,0.08)]">
          {tabs.map(t => {
            const isActive = active === t.key;
            const text = isActive ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400";
            return (
              <li key={t.href} className="flex-1">
                <Link href={t.href} className="block">
                  <span
                    className={`flex flex-col items-center justify-center rounded-full py-2 transition-all duration-200 ${
                      isActive
                        ? "bg-neutral-200 dark:bg-neutral-800 shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.08)]"
                        : "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.04)]"
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