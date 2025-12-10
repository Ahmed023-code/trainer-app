import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import MobileConsole from "@/components/MobileConsole";

export const metadata: Metadata = { title: "Trainer App", description: "Diet + Workout" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ServiceWorkerRegistration />
        <MobileConsole />
        {children}
      </body>
    </html>
  );
}
