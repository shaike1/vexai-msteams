'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Bot {
  id: number;
  platform: string;
  native_meeting_id: string;
}

interface Transcript {
  id: number;
  text: string;
  timestamp: string;
  speaker?: string;
}

interface ExportMenuProps {
  bot: Bot;
  transcripts: Transcript[];
}

export function ExportMenu({ bot, transcripts }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);

  const formatTranscriptText = () => {
    return transcripts.map(t => {
      const time = new Date(t.timestamp).toLocaleTimeString();
      const speaker = t.speaker ? `[${t.speaker}]` : '';
      return `[${time}] ${speaker} ${t.text}`;
    }).join('\n');
  };

  const downloadAsText = () => {
    const content = formatTranscriptText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${bot.platform}_${bot.native_meeting_id}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsJSON = () => {
    const data = {
      bot: {
        id: bot.id,
        platform: bot.platform,
        meeting_id: bot.native_meeting_id,
      },
      export_time: new Date().toISOString(),
      transcripts: transcripts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${bot.platform}_${bot.native_meeting_id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = () => {
    const header = 'Timestamp,Speaker,Text\n';
    const rows = transcripts.map(t => {
      const time = new Date(t.timestamp).toISOString();
      const speaker = t.speaker || '';
      const text = `"${t.text.replace(/"/g, '""')}"`;
      return `${time},${speaker},${text}`;
    }).join('\n');
    const content = header + rows;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${bot.platform}_${bot.native_meeting_id}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const content = formatTranscriptText();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const hasTranscripts = transcripts && transcripts.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!hasTranscripts}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Transcript</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadAsText}>
          <FileText className="mr-2 h-4 w-4" />
          Download as TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAsJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Download as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAsCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
