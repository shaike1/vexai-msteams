/**
 * WebSocket Service for Real-Time Updates
 * Connects to the API Gateway WebSocket endpoint and manages subscriptions
 */

type MessageHandler = (data: any) => void;

interface Subscription {
  platform: string;
  native_id: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private subscriptions: Set<string> = new Set();
  private isConnecting = false;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18056';
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    const wsUrl = this.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const url = `${wsUrl}/ws?api_key=${encodeURIComponent(this.apiKey)}`;

    console.log('[WebSocket] Connecting to:', wsUrl + '/ws');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Resubscribe to all channels
        this.resubscribeAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.isConnecting = false;
        this.ws = null;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnect attempts reached');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      console.log('[WebSocket] Disconnecting');
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to meeting updates
   */
  subscribe(platform: string, native_id: string) {
    const key = `${platform}:${native_id}`;

    if (this.subscriptions.has(key)) {
      console.log('[WebSocket] Already subscribed to:', key);
      return;
    }

    this.subscriptions.add(key);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe([{ platform, native_id }]);
    } else {
      console.log('[WebSocket] Not connected, will subscribe when connected');
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  /**
   * Unsubscribe from meeting updates
   */
  unsubscribe(platform: string, native_id: string) {
    const key = `${platform}:${native_id}`;

    if (!this.subscriptions.has(key)) {
      return;
    }

    this.subscriptions.delete(key);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendUnsubscribe([{ platform, native_id }]);
    }
  }

  /**
   * Register a message handler for a specific event type
   */
  on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister a message handler
   */
  off(event: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any) {
    const type = data.type;

    if (type === 'error') {
      console.error('[WebSocket] Server error:', data.error, data.details);
      this.notifyHandlers('error', data);
      return;
    }

    if (type === 'subscribed') {
      console.log('[WebSocket] Subscribed to meetings:', data.meetings);
      this.notifyHandlers('subscribed', data);
      return;
    }

    if (type === 'unsubscribed') {
      console.log('[WebSocket] Unsubscribed from meetings:', data.meetings);
      this.notifyHandlers('unsubscribed', data);
      return;
    }

    // Handle transcript and status updates
    if (type === 'transcript.mutable' || type === 'transcript.finalized') {
      this.notifyHandlers('transcript', data);
    } else if (type === 'meeting.status') {
      this.notifyHandlers('status', data);
    }

    // Notify handlers for the specific type
    this.notifyHandlers(type, data);
  }

  /**
   * Notify all registered handlers for an event
   */
  private notifyHandlers(event: string, data: any) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Send subscribe message to server
   */
  private sendSubscribe(meetings: Subscription[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'subscribe',
        meetings
      };
      console.log('[WebSocket] Sending subscribe:', message);
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send unsubscribe message to server
   */
  private sendUnsubscribe(meetings: Subscription[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        meetings
      };
      console.log('[WebSocket] Sending unsubscribe:', message);
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Resubscribe to all meetings after reconnection
   */
  private resubscribeAll() {
    if (this.subscriptions.size === 0) {
      return;
    }

    const meetings: Subscription[] = Array.from(this.subscriptions).map(key => {
      const [platform, native_id] = key.split(':');
      return { platform, native_id };
    });

    this.sendSubscribe(meetings);
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'ping' }));
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
