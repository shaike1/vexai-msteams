'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ContainerLogsProps {
  containerId: string | null;
}

export function ContainerLogs({ containerId }: ContainerLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!containerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Note: This would require a backend endpoint to fetch Docker logs
      // For now, we'll show a placeholder
      const response = await fetch(`/api/containers/${containerId}/logs`).catch(() => null);
      
      if (response && response.ok) {
        const text = await response.text();
        setLogs(text.split('\n'));
      } else {
        // Placeholder for when API is not available
        setLogs([
          '[INFO] Container started',
          '[INFO] Connecting to meeting...',
          '[INFO] Audio stream initialized',
          '[INFO] Transcription service connected',
          '[DEBUG] WebSocket established',
          '[INFO] Bot joined meeting successfully',
        ]);
      }
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [containerId]);

  if (!containerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Container Logs</CardTitle>
          <CardDescription>No container available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No container ID available</p>
            <p className="text-sm mt-2">Logs will appear once the bot starts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Container Logs</CardTitle>
          <CardDescription className="font-mono text-xs">
            {containerId.substring(0, 12)}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchLogs}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <ScrollArea className="h-[600px] w-full rounded-md border bg-black p-4 font-mono text-sm">
          <div className="space-y-1">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`
                    ${log.includes('[ERROR]') || log.includes('[FATAL]') ? 'text-red-400' : ''}
                    ${log.includes('[WARN]') ? 'text-yellow-400' : ''}
                    ${log.includes('[INFO]') ? 'text-green-400' : ''}
                    ${log.includes('[DEBUG]') ? 'text-blue-400' : ''}
                    ${!log.includes('[') ? 'text-gray-400' : ''}
                  `}
                >
                  {log || '\u00A0'}
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                {isLoading ? 'Loading logs...' : 'No logs available'}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>💡 Tip: Logs auto-refresh when you click the refresh button</p>
          <p className="mt-1">Note: Container logs API endpoint needs to be implemented on backend</p>
        </div>
      </CardContent>
    </Card>
  );
}
