'use client';

import { Bot, botApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StopCircle, ExternalLink, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useBotStore } from '@/lib/stores/botStore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface BotCardProps {
  bot: Bot;
}

export function BotCard({ bot }: BotCardProps) {
  const queryClient = useQueryClient();
  const { selectBot } = useBotStore();
  const router = useRouter();
  const { toast } = useToast();

  const stopMutation = useMutation({
    mutationFn: () => botApi.stopBot(bot.platform, bot.native_meeting_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast({
        variant: "success",
        title: "Bot Stopped",
        description: "The bot has been stopped and will leave the meeting shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.detail || "Failed to stop bot. Please try again.",
      });
    },
  });

  const statusColors = {
    active: 'bg-green-500',
    waiting_for_audio: 'bg-yellow-500',
    requested: 'bg-blue-500',
    failed: 'bg-red-500',
    stopped: 'bg-gray-500',
  };

  const statusColor = statusColors[bot.status as keyof typeof statusColors] || 'bg-gray-500';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Bot #{bot.id}</CardTitle>
          <Badge className={`${statusColor} text-white`}>{bot.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Platform</p>
          <p className="font-medium">{bot.platform}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-1">Meeting ID</p>
          <p className="font-medium text-sm truncate">{bot.native_meeting_id}</p>
        </div>

        {bot.created_at && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="text-sm">{formatDistanceToNow(new Date(bot.created_at), { addSuffix: true })}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/bots/${bot.id}`)}
          >
            <FileText className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {bot.status === 'active' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
