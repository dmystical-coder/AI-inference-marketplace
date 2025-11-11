"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleCheck, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PaymentModal } from "@/components/payment-modal";
import { useWallet } from "@solana/wallet-adapter-react";

export default function InferencePage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const serviceId = params.serviceId as string;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [serviceData, setServiceData] = useState<any>(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [txSignature, setTxSignature] = useState<string>("");

  // Fetch service details (including price and provider wallet)
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        const foundService = data.services?.find(
          (s: any) => s.id === serviceId
        );

        if (foundService) {
          setServiceData(foundService);
        } else {
          toast.error("Service not found");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Failed to load service details");
      } finally {
        setIsLoadingService(false);
      }
    };

    fetchService();
  }, [serviceId, router]);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Please enter your input");
      return;
    }

    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!serviceData) {
      toast.error("Service data not loaded");
      return;
    }

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (signature: string) => {
    setShowPaymentModal(false);
    setIsProcessing(true);
    setOutput("");
    setHasResult(false);
    setTxSignature(signature);

    try {
      // Submit to backend proxy with real payment signature
      const response = await fetch("/api/inference/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          input,
          paymentTx: signature,
          userWallet: publicKey?.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Inference failed");
      }

      setOutput(data.result.output);
      setHasResult(true);
      toast.success("Inference completed successfully!");
    } catch (error: any) {
      console.error("Error processing inference:", error);
      toast.error(error.message || "Failed to process inference");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setOutput("");
    setHasResult(false);
    setTxSignature("");
  };

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-40 mb-6 bg-zinc-900/50" />
          <Skeleton className="h-16 w-96 mb-8 bg-zinc-900/50" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[600px] rounded-xl bg-zinc-900/50" />
            <Skeleton className="h-[600px] rounded-xl bg-zinc-900/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Modal */}
        {serviceData && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSuccess={handlePaymentSuccess}
            serviceId={serviceId}
            serviceName={serviceData.name}
            price={serviceData.pricePerRequest}
            providerWallet={serviceData.providerWallet}
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 px-4 py-2 mb-6 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Services
          </button>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {serviceData?.name || "AI Service"}
            </h1>
            <p className="text-lg text-zinc-400 mb-4">
              {serviceData?.description || "AI-powered inference"}
            </p>
            {serviceData && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="text-sm font-semibold text-violet-300">
                  {serviceData.pricePerRequest} SOL
                </span>
                <span className="text-sm text-zinc-500">per request</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80">
              <h2 className="text-xl font-semibold text-white mb-2">Input</h2>
              <p className="text-sm text-zinc-400">
                {serviceData?.category === "image-generation"
                  ? "Describe the image you want to generate"
                  : serviceData?.category === "audio-processing"
                  ? "Provide audio description or file reference"
                  : "Enter your text prompt or data"}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="input"
                    className="text-sm font-medium text-zinc-300"
                  >
                    {serviceData?.category === "image-generation"
                      ? "Image Description"
                      : "Your Prompt"}
                  </Label>
                  <Textarea
                    id="input"
                    placeholder={
                      serviceData?.category === "image-generation"
                        ? "A serene landscape with mountains at sunset..."
                        : serviceData?.category === "audio-processing"
                        ? "Audio file: recording.mp3 or describe your audio..."
                        : "Type your prompt or question here..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={18}
                    className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={
                  input.length === 0 ||
                  isProcessing ||
                  !connected ||
                  !serviceData
                }
                className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-violet-600 disabled:hover:to-purple-600 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : !connected ? (
                  "Connect Wallet to Continue"
                ) : (
                  "Pay & Run Inference"
                )}
              </button>
              {hasResult && (
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80">
              <h2 className="text-xl font-semibold text-white mb-2">Output</h2>
              <p className="text-sm text-zinc-400">
                Your inference results will appear here
              </p>
            </div>
            <div className="p-6 min-h-[400px] flex flex-col">
              {isProcessing ? (
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                  <Skeleton className="h-4 w-4/6 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-3/6 bg-zinc-800" />
                  <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                  <Skeleton className="h-4 w-2/6 bg-zinc-800" />
                </div>
              ) : hasResult ? (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CircleCheck
                      size={20}
                      className="text-emerald-400 flex-shrink-0"
                    />
                    <span className="text-sm font-semibold text-emerald-300">
                      Inference completed successfully!
                    </span>
                  </div>
                  {txSignature && !txSignature.startsWith("mock-tx-") && (
                    <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <p className="text-sm font-semibold text-white mb-2">
                        Transaction Verified
                      </p>
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:text-violet-300 hover:underline break-all transition-colors cursor-pointer"
                      >
                        View on Solana Explorer →
                      </a>
                    </div>
                  )}
                  <div className="p-5 rounded-lg bg-zinc-800 border border-zinc-700">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-zinc-200 leading-relaxed">
                      {output}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-zinc-500">
                    Run inference to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-2">
                  How it works
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Each inference requires a Solana payment. Click{" "}
                  <span className="text-violet-400 font-medium">
                    "Pay & Run Inference"
                  </span>{" "}
                  to initiate a transaction from your wallet. Once confirmed
                  on-chain, your inference will be processed immediately.
                  {serviceData && (
                    <span className="block mt-3 text-zinc-300">
                      <span className="font-semibold">Price:</span>{" "}
                      {serviceData.pricePerRequest} SOL per request
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
