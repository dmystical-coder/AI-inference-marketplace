'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const WalletButton = dynamic(
  () => import("@/components/wallet-button").then((mod) => mod.WalletButton),
  { ssr: false }
);

export function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/95 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between gap-4">
          {/* Logo - Bento Card */}
            <Link 
              href="/" 
              className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/20">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-base font-bold tracking-tight text-white hidden sm:inline-block">
                Inference
              </span>
            </Link>

          {/* Centered Navigation - Bento Cards */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 p-1 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shadow-xl shadow-black/10">
            <Link
              href="/"
              className={cn(
                "relative px-4 py-2 text-[15px] font-semibold transition-all duration-200 rounded-lg",
                isActive("/") && !pathname.includes("/provider") && !pathname.includes("/inference")
                  ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              )}
            >
              Services
            </Link>
            <Link
              href="/provider"
              className={cn(
                "relative px-4 py-2 text-[15px] font-semibold transition-all duration-200 rounded-lg",
                isActive("/provider")
                  ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              )}
            >
              Providers
            </Link>
          </nav>

          {/* Right side - Bento arrangement */}
          <div className="flex items-center gap-2">
            {/* Mobile Navigation - Bento Cards */}
            <nav className="flex md:hidden items-center gap-1.5 p-1 rounded-lg border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
              <Link
                href="/"
                className={cn(
                  "px-3 py-1.5 text-sm font-semibold transition-all duration-200 rounded-md",
                  isActive("/") && !pathname.includes("/provider")
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                Services
              </Link>
              <Link
                href="/provider"
                className={cn(
                  "px-3 py-1.5 text-sm font-semibold transition-all duration-200 rounded-md",
                  isActive("/provider")
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                Providers
              </Link>
            </nav>

            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}

