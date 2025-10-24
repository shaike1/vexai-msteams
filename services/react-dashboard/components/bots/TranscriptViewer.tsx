'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface Transcript {
  id: number;
  text: string;
  timestamp: string;
  speaker?: string;
  segment_id?: string;
}

interface TranscriptViewerProps {
  transcripts: Transcript[];
  isActive: boolean;
}

export function TranscriptViewer({ transcripts, isActive }: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcripts arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            {isActive ? 'Waiting for audio...' : 'No transcripts available'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            {isActive ? (
              <>
                <div className="mb-4">
                  <div className="animate-pulse flex space-x-2 justify-center">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-blue-500 rounded-full animation-delay-200"></div>
                    <div className="h-3 w-3 bg-blue-500 rounded-full animation-delay-400"></div>
                  </div>
                </div>
                <p>🎤 Listening for audio...</p>
                <p className="text-sm mt-2">Transcripts will appear here in real-time</p>
              </>
            ) : (
              <>
                <p>📝 No transcripts yet</p>
                <p className="text-sm mt-2">Start the bot to see transcripts</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Live Transcript</CardTitle>
          <CardDescription>
            {transcripts.length} segment{transcripts.length !== 1 ? 's' : ''} captured
          </CardDescription>
        </div>
        {isActive && (
          <Badge className="bg-green-500 text-white animate-pulse">
            🔴 LIVE
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4" ref={scrollRef}>
          <div className="space-y-4">
            {transcripts.map((transcript, index) => (
              <div
                key={transcript.id || index}
                className="flex gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {new Date(transcript.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex-1">
                  {transcript.speaker && (
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      {transcript.speaker}
                    </div>
                  )}
                  <div className="text-gray-900 dark:text-gray-100">
                    {transcript.text}
                  </div>
                  {transcript.segment_id && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      ID: {transcript.segment_id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {isActive && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Auto-scrolling enabled</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              Refreshing every 3s
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
