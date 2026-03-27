import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DirectionWrapper } from "@/components/direction-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rareb - Investment Portfolio Management",
  description: "Private wealth management dashboard for tracking investments and debts with real-time multi-device sync.",
  keywords: ["investment", "portfolio", "wealth management", "finance", "tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
