'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { botApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, RefreshCw, StopCircle, Activity, FileText, Container } from 'lucide-react';
import { useState } from 'react';
import { TranscriptViewer } from '@/components/bots/TranscriptViewer';
import { ExportMenu } from '@/components/bots/ExportMenu';
import { ContainerLogs } from '@/components/bots/ContainerLogs';

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const [isStoppingBot, setIsStoppingBot] = useState(false);

  const { data: bot, isLoading, error, refetch } = useQuery({
    queryKey: ['bot', botId],
    queryFn: () => botApi.getBotById(botId),
    refetchInterval: 5000,
  });

  const { data: transcripts } = useQuery({
    queryKey: ['transcripts', bot?.platform, bot?.native_meeting_id],
    queryFn: () => botApi.getTranscripts(bot!.platform, bot!.native_meeting_id),
    enabled: !!bot && bot.status === 'active',
    refetchInterval: 3000,
  });

  const handleStopBot = async () => {
    if (!bot) return;
    setIsStoppingBot(true);
    try {
      await botApi.stopBot(bot.platform, bot.native_meeting_id);
      await refetch();
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setIsStoppingBot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Error Loading Bot</CardTitle>
              <CardDescription>Bot not found or failed to load.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-500',
    waiting: 'bg-yellow-500',
    failed: 'bg-red-500',
    requested: 'bg-blue-500',
    stopped: 'bg-gray-500',
  };

  const statusColor = statusColors[bot.status as keyof typeof statusColors] || 'bg-gray-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bot #{bot.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {bot.platform.toUpperCase()} • {bot.native_meeting_id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ExportMenu bot={bot} transcripts={transcripts || []} />
            {bot.status === 'active' && (
              <Button
                variant="destructive"
                onClick={handleStopBot}
                disabled={isStoppingBot}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                {isStoppingBot ? 'Stopping...' : 'Stop Bot'}
              </Button>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Bot Status</CardTitle>
              <Badge className={`${statusColor} text-white`}>
                {bot.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Platform</p>
                <p className="font-semibold">{bot.platform.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Meeting ID</p>
                <p className="font-mono text-sm">{bot.native_meeting_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Container</p>
                <p className="font-mono text-xs truncate">
                  {bot.bot_container_id ? bot.bot_container_id.substring(0, 12) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm">{new Date(bot.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Started</p>
                <p className="text-sm">
                  {bot.start_time ? new Date(bot.start_time).toLocaleString() : 'Not started'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Meeting URL</p>
                <p className="text-xs truncate">{bot.constructed_meeting_url}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transcript" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="transcript">
              <FileText className="mr-2 h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <Activity className="mr-2 h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Container className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript">
            <TranscriptViewer 
              transcripts={transcripts || []} 
              isActive={bot.status === 'active'}
            />
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Bot Metrics</CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Transcripts</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {transcripts?.length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {bot.status === 'active' ? '🟢 Live' : '⚪ Idle'}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {bot.start_time 
                          ? `${Math.floor((Date.now() - new Date(bot.start_time).getTime()) / 60000)}m`
                          : '0m'
                        }
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {bot.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <ContainerLogs containerId={bot.bot_container_id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
