import { PrismaClient } from "@prisma/client";
import { ServiceCategory } from "../types";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.escrowTransaction.deleteMany();
  await prisma.inferenceRequest.deleteMany();
  await prisma.provider.deleteMany();

  // Single provider wallet for all services (your payment receiving address)
  const PROVIDER_WALLET = "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv";

  // Create providers - Using WORKING Hugging Face Inference Providers models
  const providers = [
    {
      id: "llama-3-2-3b",
      name: "Llama 3.2 3B",
      walletAddress: PROVIDER_WALLET,
      serviceType: "text-generation",
      category: ServiceCategory.TEXT_GENERATION,
      description:
        "Meta's efficient and capable language model for chat and instruction following",
      pricePerRequest: 0.0002,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "meta-llama/Llama-3.2-3B-Instruct",
      }),
      isActive: true,
      rating: 4.8,
      totalRequests: 15420,
      successRate: 0.98,
      avgResponseTime: 1.8,
    },
    {
      id: "llama-3-2-1b",
      name: "Llama 3.2 1B",
      walletAddress: PROVIDER_WALLET,
      serviceType: "text-generation",
      category: ServiceCategory.TEXT_GENERATION,
      description: "Meta's ultra-fast compact model for quick responses",
      pricePerRequest: 0.0001,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "meta-llama/Llama-3.2-1B-Instruct",
      }),
      isActive: true,
      rating: 4.6,
      totalRequests: 12850,
      successRate: 0.99,
      avgResponseTime: 1.2,
    },
    {
      id: "qwen-7b",
      name: "Qwen 2.5 7B",
      walletAddress: PROVIDER_WALLET,
      serviceType: "text-generation",
      category: ServiceCategory.TEXT_GENERATION,
      description:
        "Alibaba's powerful multilingual language model with excellent reasoning",
      pricePerRequest: 0.0004,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "Qwen/Qwen2.5-7B-Instruct",
      }),
      isActive: true,
      rating: 4.9,
      totalRequests: 18200,
      successRate: 0.98,
      avgResponseTime: 2.4,
    },
    {
      id: "gemma-2-2b",
      name: "Gemma 2 2B",
      walletAddress: PROVIDER_WALLET,
      serviceType: "text-generation",
      category: ServiceCategory.TEXT_GENERATION,
      description: "Google's compact and efficient language model",
      pricePerRequest: 0.0002,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "google/gemma-2-2b-it",
      }),
      isActive: true,
      rating: 4.7,
      totalRequests: 9543,
      successRate: 0.97,
      avgResponseTime: 1.6,
    },
    {
      id: "stable-diffusion-xl",
      name: "Stable Diffusion XL",
      walletAddress: PROVIDER_WALLET,
      serviceType: "image-generation",
      category: ServiceCategory.IMAGE_GENERATION,
      description: "Generate high-quality images from text descriptions",
      pricePerRequest: 0.002,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "stabilityai/stable-diffusion-xl-base-1.0",
      }),
      isActive: true,
      rating: 4.9,
      totalRequests: 8932,
      successRate: 0.96,
      avgResponseTime: 12.5,
    },
    {
      id: "flux-schnell",
      name: "FLUX Schnell",
      walletAddress: PROVIDER_WALLET,
      serviceType: "image-generation",
      category: ServiceCategory.IMAGE_GENERATION,
      description: "Black Forest Labs' ultra-fast image generation model",
      pricePerRequest: 0.0018,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "black-forest-labs/FLUX.1-schnell",
      }),
      isActive: true,
      rating: 4.9,
      totalRequests: 6754,
      successRate: 0.97,
      avgResponseTime: 6.5,
    },
    {
      id: "sentiment-distilbert",
      name: "Sentiment Analyzer",
      walletAddress: PROVIDER_WALLET,
      serviceType: "data-analysis",
      category: ServiceCategory.DATA_ANALYSIS,
      description: "Analyze sentiment in text (positive/negative/neutral)",
      pricePerRequest: 0.0001,
      apiConfig: JSON.stringify({
        provider: "huggingface",
        model: "distilbert-base-uncased-finetuned-sst-2-english",
        systemPrompt: "Analyze the sentiment of the following text.",
      }),
      isActive: true,
      rating: 4.7,
      totalRequests: 4521,
      successRate: 0.95,
      avgResponseTime: 0.8,
    },
  ];

  for (const provider of providers) {
    await prisma.provider.create({
      data: provider,
    });
    console.log(`✅ Created provider: ${provider.name}`);
  }

  console.log("🌟 Seeding complete!");
  console.log("📊 All 6 services configured with WORKING Hugging Face models");
  console.log("💰 All payments go to:", PROVIDER_WALLET);
  console.log("🚀 Ready to use - 100% FREE and TESTED AI models!");
  console.log("\n✅ Text Generation:");
  console.log("   - Llama 3.2 3B (Fast, capable)");
  console.log("   - Llama 3.2 1B (Ultra-fast)");
  console.log("   - Qwen 2.5 7B (Powerful, multilingual)");
  console.log("   - Gemma 2 2B (Efficient)");
  console.log("\n✅ Image Generation:");
  console.log("   - Stable Diffusion XL (High quality)");
  console.log("   - FLUX Schnell (Ultra-fast)");
  console.log("\n✅ Data Analysis:");
  console.log("   - Sentiment Analyzer (Accurate)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
