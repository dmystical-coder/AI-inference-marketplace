// Enums for the Solana Inference Marketplace

export enum ServiceCategory {
  TEXT_GENERATION = 'text-generation',
  IMAGE_GENERATION = 'image-generation',
  AUDIO_PROCESSING = 'audio-processing',
  VIDEO_PROCESSING = 'video-processing',
  DATA_ANALYSIS = 'data-analysis'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export enum PaymentStatus {
  REQUIRED = 'required',
  PROCESSING = 'processing',
  VERIFIED = 'verified',
  FAILED = 'failed'
}

export enum InferenceStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Type definitions for Solana Inference Marketplace

// Props types
export interface RootProps {
  initialWalletConnected: boolean;
}

export interface ServiceCardProps {
  service: Service;
  onUseService: (serviceId: string) => void;
}

export interface InferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSubmitInference: (serviceId: string, input: string) => Promise<void>;
}

export interface ProviderDashboardProps {
  walletAddress: string;
}

export interface WalletButtonProps {
  connected: boolean;
  publicKey: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

// Query types (API response data)
export interface Service {
  id: string;
  name: string;
  description: string;
  provider: string;
  pricePerRequest: number;
  category: ServiceCategory;
  rating: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
}

export interface ProviderStats {
  totalRequests: number;
  successRate: number;
  totalEarnings: number;
  averageResponseTime: number;
  activeServices: number;
  totalServices: number;
}

export interface Transaction {
  id: string;
  signature: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  userWallet: string;
}

export interface InferenceResult {
  id: string;
  serviceId: string;
  status: InferenceStatus;
  input: string;
  output: string;
  timestamp: Date;
  processingTime: number;
}

export interface PaymentRequest {
  recipient: string;
  amount: number;
  currency: string;
  requestId: string;
}

export interface InferenceRequestResponse {
  requestId: string;
  paymentRequired: boolean;
  paymentDetails?: PaymentRequest;
}