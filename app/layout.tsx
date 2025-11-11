import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/lib/wallet-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solana Inference Marketplace",
  description: "Discover, pay for, and use AI inference services on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SolanaWalletProvider>
          <div className="min-h-screen flex flex-col">
            <Header />

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-6 md:py-8 bg-zinc-950">
              <div className="container mx-auto px-4 text-center body-sm text-zinc-500">
                © 2024 Solana Inference Marketplace. Built with Next.js and Solana.
              </div>
            </footer>
          </div>
          <Toaster />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
