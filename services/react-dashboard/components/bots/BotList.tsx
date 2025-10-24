'use client';

import { Bot } from '@/lib/api';
import { BotCard } from './BotCard';

interface BotListProps {
  bots: Bot[];
  isLoading: boolean;
}

export function BotList({ bots, isLoading }: BotListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-6 h-48"></div>
        ))}
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg mb-2">No bots yet</p>
        <p className="text-gray-400">Click "Create Bot" to get started</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bots.map((bot) => (
        <BotCard key={bot.id} bot={bot} />
      ))}
    </div>
  );
}
