import type { Metadata, Viewport } from "next";
import { DM_Mono, Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600", "700"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Cari Tadika",
  description: "Find nearby kindergartens, check them against 9 red flags, and compare before you enrol.",
  // Lets iPhone Safari "Add to Home Screen" open it full-screen like an app.
  appleWebApp: { capable: true, title: "Cari Tadika", statusBarStyle: "default" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms" className={`${fraunces.variable} ${outfit.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
