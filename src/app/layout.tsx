import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

const head = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-head" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const code = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-code" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Quotes, scheduling, invoices and a client portal for field service businesses.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable} ${code.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
