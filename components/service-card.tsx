"use client";

import type { Service } from "@/types";
import Link from "next/link";
import { formatSOL, formatCategory, formatPercentage } from "@/lib/utils";
import { Star, Clock, ArrowRight, TrendingUp } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="relative h-full flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="relative p-5 space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-white line-clamp-1">
              {service.name}
            </h3>
            <div className="shrink-0 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-300">
              {formatCategory(service.category)}
            </div>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Provider
            </span>
            <span className="text-sm font-medium text-zinc-300">
              {service.provider}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Price
            </span>
            <span className="text-base font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {formatSOL(service.pricePerRequest)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800">
              <div className="flex items-center gap-1 mb-1">
                <Star size={12} className="fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-semibold text-white">
                  {service.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Rating
              </span>
            </div>

            <div className="flex flex-col items-center p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-xs font-semibold text-white">
                  {formatPercentage(service.successRate)}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Success
              </span>
            </div>

            <div className="flex flex-col items-center p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800">
              <div className="flex items-center gap-1 mb-1">
                <Clock size={12} className="text-blue-500" />
                <span className="text-xs font-semibold text-white">
                  {service.averageResponseTime.toFixed(1)}s
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Response
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link href={`/inference/${service.id}`} className="w-full">
          <button className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 cursor-pointer">
            Use Service
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>
    </div>
  );
}
