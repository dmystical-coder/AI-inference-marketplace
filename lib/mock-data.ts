import { ServiceCategory, TransactionStatus, InferenceStatus } from '@/types';

// Mock data for API queries
export const mockQuery = {
  services: [
    {
      id: 'gpt4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Advanced language model for text generation, completion, and conversation',
      provider: '7xKz...9mPq',
      pricePerRequest: 0.003,
      category: ServiceCategory.TEXT_GENERATION,
      rating: 4.8,
      totalRequests: 15420,
      successRate: 0.98,
      averageResponseTime: 2.3
    },
    {
      id: 'claude-opus',
      name: 'Claude Opus',
      description: 'High-quality text generation with exceptional reasoning capabilities',
      provider: '3dEf...5gHi',
      pricePerRequest: 0.0025,
      category: ServiceCategory.TEXT_GENERATION,
      rating: 4.9,
      totalRequests: 12850,
      successRate: 0.99,
      averageResponseTime: 2.1
    },
    {
      id: 'llama3-70b',
      name: 'Llama 3 70B',
      description: 'Open-source large language model for diverse text generation tasks',
      provider: '6jKl...8mNo',
      pricePerRequest: 0.0005,
      category: ServiceCategory.TEXT_GENERATION,
      rating: 4.7,
      totalRequests: 18200,
      successRate: 0.97,
      averageResponseTime: 1.8
    },
    {
      id: 'dalle3',
      name: 'DALL-E 3',
      description: 'Generate high-quality images from text descriptions with advanced AI',
      provider: '9aLm...3nRt',
      pricePerRequest: 0.002,
      category: ServiceCategory.IMAGE_GENERATION,
      rating: 4.9,
      totalRequests: 8932,
      successRate: 0.96,
      averageResponseTime: 5.7
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      description: 'Create stunning photorealistic images with open-source AI',
      provider: '9aLm...3nRt',
      pricePerRequest: 0.001,
      category: ServiceCategory.IMAGE_GENERATION,
      rating: 4.8,
      totalRequests: 6754,
      successRate: 0.97,
      averageResponseTime: 4.2
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      description: 'Creative and artistic image generation with unique style',
      provider: '1pQr...4sTu',
      pricePerRequest: 0.0015,
      category: ServiceCategory.IMAGE_GENERATION,
      rating: 4.9,
      totalRequests: 9543,
      successRate: 0.98,
      averageResponseTime: 6.3
    },
    {
      id: 'whisper-large',
      name: 'Whisper Large',
      description: 'Convert speech to text with high accuracy across multiple languages',
      provider: '5cNp...7qSv',
      pricePerRequest: 0.0008,
      category: ServiceCategory.AUDIO_PROCESSING,
      rating: 4.7,
      totalRequests: 12100,
      successRate: 0.99,
      averageResponseTime: 3.1
    },
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze sentiment and emotions in text with AI-powered insights',
      provider: '2bKl...8pWx',
      pricePerRequest: 0.0002,
      category: ServiceCategory.DATA_ANALYSIS,
      rating: 4.6,
      totalRequests: 4521,
      successRate: 0.95,
      averageResponseTime: 1.2
    }
  ],
  
  providerStats: {
    totalRequests: 21032,
    successRate: 0.97,
    totalEarnings: 1847.32,
    averageResponseTime: 4.2,
    activeServices: 3,
    totalServices: 4
  },
  
  recentTransactions: [
    {
      id: 'tx-1',
      signature: '5KzX...9mPq2aLm3nRt',
      serviceId: 'service-2',
      serviceName: 'DALL-E Image Creator',
      amount: 0.15,
      status: TransactionStatus.CONFIRMED,
      timestamp: new Date('2024-01-15T14:32:00Z'),
      userWallet: '3bKl...8pWx'
    },
    // ... existing code ...
    {
      id: 'tx-2',
      signature: '7aLm...3nRt5cNp7qSv',
      serviceId: 'service-3',
      serviceName: 'Whisper Audio Transcription',
      amount: 0.03,
      status: TransactionStatus.CONFIRMED,
      timestamp: new Date('2024-01-15T13:18:00Z'),
      userWallet: '9mPq...2aLm'
    },
    {
      id: 'tx-3',
      signature: '2cNp...7qSv9aLm3nRt',
      serviceId: 'service-1',
      serviceName: 'GPT-4 Text Generation',
      amount: 0.05,
      status: TransactionStatus.CONFIRMED,
      timestamp: new Date('2024-01-15T12:45:00Z'),
      userWallet: '8pWx...5cNp'
    },
    {
      id: 'tx-4',
      signature: '4bKl...8pWx7xKz9mPq',
      serviceId: 'service-4',
      serviceName: 'Stable Diffusion XL',
      amount: 0.12,
      status: TransactionStatus.PENDING,
      timestamp: new Date('2024-01-15T11:22:00Z'),
      userWallet: '7qSv...9aLm'
    }
  ],
  
  inferenceResult: {
    id: 'inference-1',
    serviceId: 'service-1',
    status: InferenceStatus.COMPLETED,
    input: 'Write a haiku about blockchain technology',
    output: 'Blocks linked in chain\nDecentralized trust prevails\nFuture built on code',
    timestamp: new Date('2024-01-15T14:35:00Z'),
    processingTime: 2.1
  }
};

// Mock data for root component props
export const mockRootProps = {
  initialWalletConnected: false
};