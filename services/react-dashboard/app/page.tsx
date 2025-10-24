'use client';

import { useQuery } from '@tanstack/react-query';
import { botApi } from '@/lib/api';
import { useBotStore } from '@/lib/stores/botStore';
import { useEffect } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { BotList } from '@/components/bots/BotList';
import { CreateBotDialog } from '@/components/bots/CreateBotDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const { setBots } = useBotStore();
  
  const { data: bots, isLoading, error, refetch } = useQuery({
    queryKey: ['bots'],
    queryFn: botApi.getBots,
  });

  useEffect(() => {
    if (bots) {
      setBots(bots);
    }
  }, [bots, setBots]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🤖 Vexa Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your MS Teams meeting bots
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-10 w-10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <CreateBotDialog />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ Failed to connect to API. Please ensure services are running.
          </div>
        )}

        <DashboardStats bots={bots || []} isLoading={isLoading} />
        
        <div className="mt-8">
          <BotList bots={bots || []} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
