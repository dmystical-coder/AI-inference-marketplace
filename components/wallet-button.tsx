'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return (
    <WalletMultiButton className="!bg-gradient-to-br !from-violet-600 !to-purple-600 !text-white !rounded-lg !px-4 !py-2 !text-[15px] !font-semibold !border !border-violet-500/20 hover:!from-violet-500 hover:!to-purple-500 !transition-all !duration-200 !shadow-lg !shadow-purple-500/20" />
  );
}