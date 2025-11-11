import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";
import { db } from "./db";

/**
 * Provider Adapter Interface
 * All AI provider adapters must implement this interface
 */
export interface ProviderAdapter {
  callInference(input: string, config: any): Promise<string>;
}

/**
 * OpenAI Adapter - Real AI integration
 */
class OpenAIAdapter implements ProviderAdapter {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async callInference(input: string, config: any): Promise<string> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = config.model || "gpt-4o";

        // Handle image generation models (DALL-E)
        if (model.includes("dall-e")) {
          return await this.generateImage(input, model);
        }

        // Handle chat/text models
        const completion = await this.client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(model),
            },
            {
              role: "user",
              content: input,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        return (
          completion.choices[0]?.message?.content || "No response generated"
        );
      } catch (error: any) {
        lastError = error;

        console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, {
          message: error.message,
          status: error.status,
          code: error.code,
          type: error.type,
        });

        // Handle rate limits with retry
        if (error.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(
            `Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue; // Retry
        }

        // For other errors or last attempt, throw with helpful message
        if (error.status === 404) {
          throw new Error(
            `OpenAI model not found: ${
              config.model || "default"
            }. Please check model availability.`
          );
        } else if (error.status === 401) {
          throw new Error(
            "OpenAI API authentication failed. Please check your API key."
          );
        } else if (error.status === 429) {
          throw new Error(
            "OpenAI rate limit exceeded. Please try again in a few minutes or upgrade your API plan."
          );
        } else if (error.status === 503) {
          throw new Error(
            "OpenAI service temporarily unavailable. Please try again."
          );
        } else if (error.status === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        }

        throw new Error(`OpenAI inference failed: ${error.message}`);
      }
    }

    // If we get here, all retries failed
    throw new Error(
      `OpenAI inference failed after ${maxRetries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  private async generateImage(prompt: string, model: string): Promise<string> {
    try {
      const size = model === "dall-e-3" ? "1024x1024" : "512x512";

      const response = await this.client.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: size as any,
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from OpenAI");
      }

      // Return JSON with image URL (OpenAI provides a URL, not a blob)
      return JSON.stringify({
        type: "image",
        prompt: prompt,
        model: model,
        imageUrl: imageUrl,
        message: "🎨 Image Generated Successfully!",
      });
    } catch (error: any) {
      console.error("DALL-E image generation error:", error);
      throw error;
    }
  }

  private getSystemPrompt(model: string): string {
    // Customize system prompts based on use case
    if (model.includes("3.5")) {
      return "You are a helpful AI assistant. Provide clear, concise, and accurate responses.";
    } else if (model.includes("sentiment") || model === "gpt-3.5-turbo") {
      // For sentiment analysis service
      return "You are a sentiment analysis expert. Analyze the emotional tone, sentiment (positive/negative/neutral), and key themes in the provided text. Provide a structured analysis with confidence scores.";
    } else {
      return "You are a helpful, creative, and intelligent AI assistant. Provide detailed, accurate, and well-structured responses.";
    }
  }
}

/**
 * Hugging Face Adapter - Free AI integration
 */
class HuggingFaceAdapter implements ProviderAdapter {
  private client: HfInference;

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY environment variable is not set");
    }
    this.client = new HfInference(apiKey);
  }

  async callInference(input: string, config: any): Promise<string> {
    const maxRetries = 3;
    let lastError: any;
    const model = config.model || "meta-llama/Meta-Llama-3-8B-Instruct";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Handle text-to-image models
        if (model.includes("stable-diffusion") || model.includes("flux")) {
          return await this.generateImage(input, model);
        }

        // Handle sentiment analysis models (classification task)
        if (model.includes("sentiment") || model.includes("distilbert")) {
          const result = await this.client.textClassification({
            model: model,
            inputs: input,
          });

          // Format sentiment results nicely
          if (Array.isArray(result) && result.length > 0) {
            let response = "📊 Sentiment Analysis Results:\n\n";
            result.forEach((item: any, index: number) => {
              response += `${index + 1}. ${item.label}: ${(
                item.score * 100
              ).toFixed(2)}%\n`;
            });
            return response;
          }
          return JSON.stringify(result, null, 2);
        }

        // For conversational/instruct models, use chatCompletion API
        // This is the new Inference Providers API that routes to the correct backend
        const systemPrompt = this.getSystemPrompt(config);

        const messages: Array<{ role: string; content: string }> = [];

        if (systemPrompt) {
          messages.push({
            role: "system",
            content: systemPrompt,
          });
        }

        messages.push({
          role: "user",
          content: input,
        });

        const result = await this.client.chatCompletion({
          model: model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
        });

        return result.choices[0]?.message?.content || "No response generated";
      } catch (error: any) {
        lastError = error;

        // Enhanced error logging for debugging
        console.error(
          `Hugging Face API error (attempt ${attempt}/${maxRetries}):`,
          {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            code: error.code,
            model: model,
            // Log the full error for debugging
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          }
        );

        // Handle rate limits with retry
        if (error.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(
            `Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // Retry on 503 (service unavailable / model loading)
        if (error.status === 503 && attempt < maxRetries) {
          const waitTime = 5000; // Wait 5 seconds for model to load
          console.log(
            `Model loading. Waiting ${waitTime}ms before retry ${
              attempt + 1
            }...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors or last attempt
        if (error.status === 404) {
          throw new Error(
            `Model not found: ${config.model}. The model may not be available through Inference Providers.`
          );
        } else if (error.status === 401) {
          throw new Error(
            "Hugging Face API authentication failed. Please check your API key in .env.local"
          );
        } else if (error.status === 403) {
          throw new Error(
            `Access forbidden: You may need to accept the model license at https://huggingface.co/${config.model}`
          );
        } else if (error.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please try again in a few minutes or use a different model."
          );
        } else if (error.status === 503) {
          throw new Error(
            "Model is currently loading or unavailable. Please try again in 30 seconds."
          );
        } else if (error.status === 500 || error.status === 502) {
          throw new Error(
            `Provider error: ${error.message}. Try a different model or wait a moment.`
          );
        }

        // Generic error with helpful context
        throw new Error(
          `Hugging Face inference failed: ${error.message}${
            error.status ? ` (HTTP ${error.status})` : ""
          }`
        );
      }
    }

    throw new Error(
      `Inference failed after ${maxRetries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  private async generateImage(prompt: string, model: string): Promise<string> {
    try {
      const blob = await this.client.textToImage({
        model: model,
        inputs: prompt,
      });

      // Convert blob to base64 data URL
      // Cast to Blob since the type definitions may be incorrect
      const buffer = await (blob as any as Blob).arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      // Return JSON with image data URL
      return JSON.stringify({
        type: "image",
        prompt: prompt,
        model: model,
        imageUrl: dataUrl,
        message: "🎨 Image Generated Successfully!",
      });
    } catch (error: any) {
      console.error("Hugging Face image generation error:", error);
      throw error;
    }
  }

  private getSystemPrompt(config: any): string {
    if (config.systemPrompt) {
      return config.systemPrompt;
    }

    return "You are a helpful, creative, and intelligent AI assistant. Provide detailed, accurate, and well-structured responses.";
  }
}

/**
 * Route inference request to the appropriate provider
 */
export async function routeToProvider(
  providerId: string,
  input: string
): Promise<string> {
  // Get provider configuration from database
  const provider = await db.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  if (!provider.isActive) {
    throw new Error(`Provider is not active: ${provider.name}`);
  }

  // Parse API configuration
  const apiConfig = provider.apiConfig ? JSON.parse(provider.apiConfig) : {};

  // Select adapter based on provider type
  let adapter: ProviderAdapter;

  const providerType = apiConfig.provider || "huggingface"; // Default to Hugging Face

  if (providerType === "openai") {
    adapter = new OpenAIAdapter();
  } else if (providerType === "huggingface") {
    adapter = new HuggingFaceAdapter();
  } else {
    throw new Error(`Unknown provider type: ${providerType}`);
  }

  // Call the inference
  try {
    const result = await adapter.callInference(input, apiConfig);
    return result;
  } catch (error: any) {
    console.error(`Inference failed for provider ${providerId}:`, error);
    throw new Error(`Inference failed: ${error.message}`);
  }
}
