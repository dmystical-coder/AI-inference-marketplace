"use client";

import { useState } from "react";
import type { Service, PaymentRequest, InferenceResult } from "@/types";
import { InferenceStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatUSDC } from "@/lib/utils";
import { CircleCheck, CircleAlert, Loader2, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

interface InferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSubmitInference: (serviceId: string, input: string) => Promise<void>;
}

type ModalStep = "input" | "payment" | "processing" | "result" | "error";

export function InferenceModal({
  isOpen,
  onClose,
  service,
  onSubmitInference,
}: InferenceModalProps) {
  const [step, setStep] = useState<ModalStep>("input");
  const [input, setInput] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentRequest | null>(
    null
  );
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep("input");
    setInput("");
    setPaymentDetails(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!service || !input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to request inference
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock payment required response
      const mockPaymentDetails: PaymentRequest = {
        recipient: "9aLm...3nRt",
        amount: service.pricePerRequest,
        currency: "USDC",
        requestId: `req-${Date.now()}`,
      };

      setPaymentDetails(mockPaymentDetails);
      setStep("payment");
    } catch (err) {
      setError("Failed to submit inference request. Please try again.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentDetails) return;

    setIsLoading(true);
    setStep("processing");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate getting inference result
      const mockResult: InferenceResult = {
        id: `inf-${Date.now()}`,
        serviceId: service!.id,
        status: InferenceStatus.COMPLETED,
        input,
        output:
          "This is a mock inference result. In production, this would be the actual AI-generated output based on your input.",
        timestamp: new Date(),
        processingTime: 2.3,
      };

      setResult(mockResult);
      setStep("result");
      toast.success("Inference completed successfully!");
    } catch (err) {
      setError("Payment failed. Please try again.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="heading-md">
            {step === "input" && "Submit Inference Request"}
            {step === "payment" && "Payment Required"}
            {step === "processing" && "Processing..."}
            {step === "result" && "Inference Complete"}
            {step === "error" && "Error"}
          </DialogTitle>
          <DialogDescription className="body-sm">
            {service?.name}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="input" className="body-md font-medium">
                Enter your input data
              </Label>
              <Textarea
                id="input"
                placeholder="Type your inference request here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <span className="body-sm text-text-secondary">
                Price per request
              </span>
              <span className="body-md font-semibold text-primary">
                {service && formatUSDC(service.pricePerRequest)}
              </span>
            </div>
          </div>
        )}

        {step === "payment" && paymentDetails && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="body-sm">
                Please confirm the payment to proceed with the inference
                request.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 rounded-lg bg-surface">
              <div className="flex items-center justify-between">
                <span className="body-sm text-text-secondary">Recipient</span>
                <div className="flex items-center gap-2">
                  <span className="body-sm font-mono">
                    {paymentDetails.recipient}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(paymentDetails.recipient)}
                  >
                    <ClipboardCopy size={14} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="body-sm text-text-secondary">Amount</span>
                <span className="body-lg font-semibold text-primary">
                  {formatUSDC(paymentDetails.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="body-sm text-text-secondary">Currency</span>
                <span className="body-sm font-medium">
                  {paymentDetails.currency}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="body-md text-text-secondary">
              Processing your request...
            </p>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
              <CircleCheck size={20} />
              <span className="body-sm font-medium">
                Inference completed successfully!
              </span>
            </div>

            <div className="space-y-2">
              <Label className="body-md font-medium">Input</Label>
              <div className="p-3 rounded-lg bg-surface body-sm">
                {result.input}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="body-md font-medium">Output</Label>
              {(() => {
                try {
                  const parsed = JSON.parse(result.output);
                  if (parsed.type === "image" && parsed.imageUrl) {
                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-surface body-sm">
                          {parsed.message}
                          <div className="mt-2 space-y-1 text-xs text-text-secondary">
                            <div>Prompt: {parsed.prompt}</div>
                            <div>Model: {parsed.model}</div>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-border">
                          <img
                            src={parsed.imageUrl}
                            alt={parsed.prompt}
                            className="w-full h-auto"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = parsed.imageUrl;
                            link.download = `generated-${Date.now()}.png`;
                            link.click();
                            toast.success("Image downloaded!");
                          }}
                        >
                          Download Image
                        </Button>
                      </div>
                    );
                  }
                } catch (e) {
                  // Not JSON or not an image, fall through to default
                }
                return (
                  <div className="p-3 rounded-lg bg-surface body-sm whitespace-pre-wrap">
                    {result.output}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <span className="body-sm text-text-secondary">
                Processing Time
              </span>
              <span className="body-sm font-medium">
                {result.processingTime.toFixed(2)}s
              </span>
            </div>
          </div>
        )}

        {step === "error" && error && (
          <div className="py-4">
            <Alert variant="destructive">
              <CircleAlert size={20} />
              <AlertDescription className="body-sm ml-2">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === "input" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="bg-primary text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </>
          )}

          {step === "payment" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="bg-primary text-white"
              >
                Pay with Wallet
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={handleClose} className="bg-primary text-white">
              Close
            </Button>
          )}

          {step === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("input")}
                className="bg-primary text-white"
              >
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
