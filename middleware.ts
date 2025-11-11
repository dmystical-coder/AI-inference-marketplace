import type { Address } from "viem";
import { paymentMiddleware, type Resource, type Network } from "x402-next";
import { NextRequest } from "next/server";

// Your Solana wallet address that receives payments
// TODO: Replace with your actual wallet address
const WALLET_ADDRESS =
  "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv" as Address;

// Network configuration - use devnet for testing
const NETWORK = "solana-devnet" as Network;

// X402 facilitator URL - handles payment verification
const FACILITATOR_URL = "https://x402.org/facilitator" as Resource;

// Coinbase Developer Platform client key
// TODO: Get your own key from https://portal.cdp.coinbase.com/
const CDP_CLIENT_KEY = "3uyu43EHCwgVIQx6a8cIfSkxp6cXgU30";

// Configure payment middleware with pricing for each service
const x402PaymentMiddleware = paymentMiddleware(
  WALLET_ADDRESS,
  {
    // Text Generation Services
    "/inference/gpt4-turbo": {
      price: "$0.50",
      config: {
        description: "GPT-4 Turbo - Advanced text generation",
      },
      network: NETWORK,
    },
    "/inference/claude-opus": {
      price: "$0.45",
      config: {
        description: "Claude Opus - High-quality text generation",
      },
      network: NETWORK,
    },
    "/inference/llama3-70b": {
      price: "$0.15",
      config: {
        description: "Llama 3 70B - Open-source text generation",
      },
      network: NETWORK,
    },

    // Image Generation Services
    "/inference/stable-diffusion": {
      price: "$0.25",
      config: {
        description: "Stable Diffusion - Image generation",
      },
      network: NETWORK,
    },
    "/inference/dalle3": {
      price: "$0.40",
      config: {
        description: "DALL-E 3 - Advanced image generation",
      },
      network: NETWORK,
    },
    "/inference/midjourney": {
      price: "$0.35",
      config: {
        description: "Midjourney - Creative image generation",
      },
      network: NETWORK,
    },

    // Audio Processing Services
    "/inference/whisper-large": {
      price: "$0.20",
      config: {
        description: "Whisper Large - Speech-to-text",
      },
      network: NETWORK,
    },

    // Data Analysis Services
    "/inference/sentiment-analysis": {
      price: "$0.10",
      config: {
        description: "Sentiment Analysis - Text analysis",
      },
      network: NETWORK,
    },

    // Catch-all for any inference route (optional)
    "/inference/:path*": {
      price: "$0.30",
      config: {
        description: "AI Inference Service",
      },
      network: NETWORK,
    },
  },
  {
    url: FACILITATOR_URL,
  },
  {
    cdpClientKey: CDP_CLIENT_KEY,
    appLogo: "/globe.svg",
    appName: "Solana Inference Marketplace",
    sessionTokenEndpoint: "/api/x402/session-token",
  }
);

export const middleware = (req: NextRequest) => {
  // Type assertion for x402PaymentMiddleware
  const delegate = x402PaymentMiddleware as unknown as (
    request: NextRequest
  ) => ReturnType<typeof x402PaymentMiddleware>;
  return delegate(req);
};

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // X402 is disabled for now - we're using API-based payment flow
    // To enable X402 payment gates, uncomment the routes below:
    // '/inference/:path*',
  ],
};
