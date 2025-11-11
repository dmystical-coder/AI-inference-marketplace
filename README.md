# Solana X402 AI Marketplace

> On-demand AI inference powered by Solana payments and X402 micropayments

A decentralized marketplace where AI providers offer inference services and users pay per request using Solana blockchain. Every transaction is verified on-chain, ensuring trustless, transparent AI commerce.

## 🎯 What It Does

- **Pay with SOL**: Real blockchain payments for AI services
- **Instant Results**: Get AI-generated content in seconds
- **On-Chain Verification**: Every payment verified on Solana blockchain
- **Multiple Providers**: Choose from various AI models and providers
- **Provider Earnings**: Track earnings and manage your AI services

## ✨ Key Features

### For Users

- Browse AI services (text generation, image generation, audio processing)
- Pay with Solana wallet (Phantom, Solflare, Backpack)
- Real-time transaction verification
- View results and transaction history
- Verified on-chain payments with Solana Explorer links

### For Providers

- List AI services on the marketplace
- Set custom pricing in SOL
- Track earnings and request volume
- View performance analytics
- Automatic escrow and payout system

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Blockchain**: Solana Web3.js, Solana Wallet Adapter
- **Payments**: X402 Protocol for HTTP-based micropayments
- **Database**: Prisma ORM + SQLite
- **AI**: Hugging Face Inference API (100% free) - Llama 3, Mistral, Stable Diffusion
  - OpenAI API also supported (optional, requires subscription)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Phantom/Solflare wallet browser extension
- Devnet SOL (get from [Solana faucet](https://faucet.solana.com/))

### Setup (5 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd inference-marketplace

# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env
# Get FREE Hugging Face API key: https://huggingface.co/settings/tokens
# Add HUGGINGFACE_API_KEY=hf_... to .env.local

# Initialize database
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3002

**See [HUGGINGFACE-SETUP.md](./HUGGINGFACE-SETUP.md) for detailed setup guide**

### First Test Run

1. **Connect Wallet**: Click "Select Wallet" → Choose Phantom/Solflare
2. **Get Devnet SOL**: Visit https://faucet.solana.com/ and request 2 SOL
3. **Browse Services**: Explore available AI services on homepage
4. **Make Payment**: Click "Use Service" → Enter prompt → Pay with SOL
5. **View Result**: See AI-generated output and transaction link

## 📖 How X402 Integration Works

### Payment Flow

```
User selects service → Payment modal opens → User approves SOL transaction
    ↓
Transaction sent to Solana blockchain → Confirmed in 5-10 seconds
    ↓
Backend fetches transaction from RPC → Verifies recipient and amount
    ↓
Creates escrow record → Runs AI inference → Returns result
    ↓
Escrow released to provider → User receives output
```

### X402 Protocol Usage

This marketplace implements X402 in two ways:

1. **API-Level Verification** (Current):

   - User pays directly to provider's wallet
   - Backend verifies transaction on-chain
   - Escrow managed in database
   - Perfect for demo and testing

2. **Middleware-Level Gating** (Available):
   - X402 middleware protects routes
   - Payment required before page access
   - Session-based access control
   - Enable by uncommenting routes in `middleware.ts`

### Key X402 Components

- **Payment Modal** (`components/payment-modal.tsx`): Handles wallet connection and transaction signing
- **Payment Verification** (`lib/solana-escrow.ts`): On-chain transaction verification
- **Escrow Management** (`lib/inference-engine.ts`): Hold funds until completion
- **Provider Proxy** (`lib/provider-proxy.ts`): Route requests to AI providers

## 📁 Project Structure

```
inference-marketplace/
├── app/
│   ├── api/                  # API routes
│   │   ├── activity/         # Recent activity feed
│   │   ├── inference/        # Inference submission & status
│   │   ├── services/         # Service listing
│   │   ├── stats/            # Global statistics
│   │   └── provider/         # Provider stats
│   ├── inference/[id]/       # Inference execution page
│   ├── provider/             # Provider dashboard
│   └── page.tsx              # Homepage
├── components/
│   ├── payment-modal.tsx     # Solana payment UI
│   ├── recent-activity.tsx   # Live activity feed
│   ├── stats-counter.tsx     # Global metrics
│   ├── service-card.tsx      # Service display
│   └── provider-dashboard.tsx # Provider analytics
├── lib/
│   ├── solana-escrow.ts      # Payment verification
│   ├── inference-engine.ts   # Business logic
│   ├── provider-proxy.ts     # AI provider adapters
│   └── db.ts                 # Database client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data
└── middleware.ts             # X402 middleware config
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Solana
SOLANA_RPC_URL="https://api.devnet.solana.com"

# AI Provider (FREE - No Credit Card Required!)
HUGGINGFACE_API_KEY="hf_YourTokenHere"
# Get your free token: https://huggingface.co/settings/tokens

# OpenAI (Optional - Requires Paid Subscription)
# OPENAI_API_KEY="sk-your-key-here"
```

### Switch to Mainnet

1. Update `SOLANA_RPC_URL` to mainnet:

   ```bash
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   ```

2. Update wallet network to mainnet

3. Test with small amounts first!

## 🏗 Architecture

### Payment Verification

All payments are verified on-chain:

- Fetch transaction from Solana RPC
- Verify recipient matches provider wallet
- Verify amount matches service price
- Check transaction is confirmed
- No trust required - everything verifiable

### Escrow System

1. User pays to provider's wallet
2. Backend creates escrow record
3. AI inference runs
4. On success: Escrow marked as released
5. On failure: Escrow marked for refund

### Provider Integration

Supports multiple AI providers:

- **Hugging Face**: FREE - Llama 3, Mistral, Stable Diffusion, FLUX (no subscription needed)
- **OpenAI**: GPT-4, DALL-E (requires paid subscription)
- **Extensible**: Easy to add any AI provider

## 📊 Database Schema

```prisma
model Provider {
  id              String   @id
  name            String
  walletAddress   String   @unique
  pricePerRequest Float
  category        String
  // ... stats fields
}

model InferenceRequest {
  id          String   @id
  userWallet  String
  providerId  String
  input       String
  output      String?
  status      String
  txSignature String
  // ... metadata
}

model EscrowTransaction {
  id                 String   @id
  requestId          String   @unique
  amount             Float
  status             String
  txSignature        String
  releaseTxSignature String?
  // ... timestamps
}
```

## 🐛 Troubleshooting

### "Transaction not found"

**Solution**: Wait 10-15 seconds for confirmation, then retry

### "Insufficient funds"

**Solution**: Get more devnet SOL from https://faucet.solana.com/

### "Payment verification failed"

**Solution**: Check provider wallet address in database

### Wallet won't connect

**Solution**: Ensure wallet extension installed and set to Devnet

## 🎯 Hackathon Submission

**Track**: Best x402 API Integration / Best x402 Agent Application

**Requirements Met**:

- ✅ Open source code
- ✅ X402 protocol integration
- ✅ Deployed to Solana devnet
- ✅ Demo video (3 minutes)
- ✅ Documentation

**Key Innovation**: Trustless AI marketplace where every payment is verified on-chain, enabling autonomous AI agents to transact without intermediaries.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a hackathon project. For production use, consider:

- Real escrow release mechanism (currently database-only)
- Rate limiting and abuse prevention
- Enhanced provider verification
- Multi-token support (USDC, custom tokens)
- Advanced analytics and monitoring

## 📞 Support

For issues or questions:

- Check [SETUP.md](./SETUP.md) for detailed setup
- View [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [PAYMENT-TESTING-GUIDE.md](./PAYMENT-TESTING-GUIDE.md) for testing

---

**Built with ❤️ for the Solana X402 Hackathon**

Powering the future of autonomous AI agents with trustless payments.
