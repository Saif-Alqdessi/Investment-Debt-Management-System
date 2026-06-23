import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DirectionWrapper } from "@/components/direction-wrapper";

const inter = Inter({ subsets: ["latin"] });

import { BRANDING } from "@/lib/config/branding";

export const metadata: Metadata = {
  title: `${BRANDING.appName} - Investment Portfolio Management`,
  description: `${BRANDING.tagline} dashboard for tracking investments and debts with real-time multi-device sync.`,
  keywords: ["investment", "portfolio", "wealth management", "finance", "tracking"],
};

import { generateBrandPalette } from "@/lib/theme/colors";

const palette = generateBrandPalette(BRANDING.primaryColor);
const brandVars = Object.entries(palette)
  .map(([key, val]) => `--brand-${key}: ${val};`)
  .join("\n");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root { \n${brandVars}\n }` }} />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <Providers>
          <DirectionWrapper>
            {children}
          </DirectionWrapper>
        </Providers>
      </body>
    </html>
  );
}
