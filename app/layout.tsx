import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { getAllFontVariables } from "@/lib/fonts";
import { PlayerSetupModal } from "@/components/player-setup-modal";

export const metadata: Metadata = {
  title: "ELO Leaderboard",
  description: "Track competitive rankings with ELO rating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${getAllFontVariables()} font-serif`}>
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
          <PlayerSetupModal />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
