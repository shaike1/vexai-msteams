import { useEffect, useCallback, useState } from 'react';
import { wsService } from '@/lib/websocket';

/**
 * Hook to manage WebSocket connection lifecycle
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect on mount
    wsService.connect();

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(wsService.isConnected);
    }, 1000);

    // Keep connection alive with ping
    const pingInterval = setInterval(() => {
      if (wsService.isConnected) {
        wsService.ping();
      }
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(interval);
      clearInterval(pingInterval);
    };
  }, []);

  return { isConnected };
}

/**
 * Hook to subscribe to transcript updates for a specific meeting
 */
export function useTranscriptStream(
  platform: string | undefined,
  native_id: string | undefined,
  onUpdate: (data: any) => void
) {
  useEffect(() => {
    if (!platform || !native_id) {
      return;
    }

    // Subscribe to meeting
    wsService.subscribe(platform, native_id);

    // Register transcript handler
    wsService.on('transcript', onUpdate);

    return () => {
      // Unregister handler
      wsService.off('transcript', onUpdate);

      // Unsubscribe from meeting
      wsService.unsubscribe(platform, native_id);
    };
  }, [platform, native_id, onUpdate]);
}

/**
 * Hook to subscribe to bot status updates for a specific meeting
 */
export function useBotStatus(
  platform: string | undefined,
  native_id: string | undefined,
  onUpdate: (data: any) => void
) {
  useEffect(() => {
    if (!platform || !native_id) {
      return;
    }

    // Subscribe to meeting
    wsService.subscribe(platform, native_id);

    // Register status handler
    wsService.on('status', onUpdate);

    return () => {
      // Unregister handler
      wsService.off('status', onUpdate);

      // Unsubscribe from meeting
      wsService.unsubscribe(platform, native_id);
    };
  }, [platform, native_id, onUpdate]);
}

/**
 * Hook to subscribe to all bot status updates (for dashboard)
 */
export function useAllBotsStatus(onUpdate: (data: any) => void) {
  useEffect(() => {
    // Register general status handler
    wsService.on('meeting.status', onUpdate);

    return () => {
      wsService.off('meeting.status', onUpdate);
    };
  }, [onUpdate]);
}

/**
 * Hook to get WebSocket connection errors
 */
export function useWebSocketErrors(onError: (error: any) => void) {
  useEffect(() => {
    wsService.on('error', onError);

    return () => {
      wsService.off('error', onError);
    };
  }, [onError]);
}
