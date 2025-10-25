'use client';

import { useQuery } from '@tanstack/react-query';
import { botApi } from '@/lib/api';
import { useBotStore } from '@/lib/stores/botStore';
import { useEffect, useCallback } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { BotList } from '@/components/bots/BotList';
import { CreateBotDialog } from '@/components/bots/CreateBotDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket, useAllBotsStatus } from '@/lib/hooks/useWebSocket';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const { setBots, updateBotStatus, bots: storeBots } = useBotStore();
  const { toast } = useToast();
  const { isConnected } = useWebSocket();

  const { data: bots, isLoading, error, refetch } = useQuery({
    queryKey: ['bots'],
    queryFn: botApi.getBots,
    refetchInterval: isConnected ? false : 5000, // Only poll if WebSocket disconnected
  });

  useEffect(() => {
    if (bots) {
      setBots(bots);
    }
  }, [bots, setBots]);

  // Handle real-time bot status updates via WebSocket
  const handleStatusUpdate = useCallback((data: any) => {
    console.log('[Dashboard] Status update:', data);

    if (data.type === 'meeting.status' && data.meeting && data.payload) {
      const { platform, native_id } = data.meeting;
      const { status } = data.payload;

      updateBotStatus(platform, native_id, status);

      // Show toast for significant status changes
      if (status === 'active') {
        toast({
          variant: "success",
          title: "Bot Active",
          description: `Bot for ${platform} meeting is now active.`,
        });
      } else if (status === 'failed') {
        toast({
          variant: "destructive",
          title: "Bot Failed",
          description: `Bot for ${platform} meeting has failed.`,
        });
      }
    }
  }, [updateBotStatus, toast]);

  // Subscribe to all bot status updates
  useAllBotsStatus(handleStatusUpdate);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🤖 Vexa Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-600 dark:text-gray-300">
                Manage your MS Teams meeting bots
              </p>
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400">Connecting...</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-10 w-10"
              title="Refresh bots"
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

        <DashboardStats bots={storeBots.length > 0 ? storeBots : (bots || [])} isLoading={isLoading} />

        <div className="mt-8">
          <BotList bots={storeBots.length > 0 ? storeBots : (bots || [])} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
