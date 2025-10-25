'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { botApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function CreateBotDialog() {
  const [open, setOpen] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [passcode, setPasscode] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: { platform: string; meeting_url: string; passcode?: string }) =>
      botApi.createBot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setOpen(false);
      setMeetingUrl('');
      setPasscode('');

      // Show success toast
      toast({
        variant: "success",
        title: "Success!",
        description: "Bot created successfully and is joining the meeting.",
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.detail || "Failed to create bot. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      platform: 'teams',
      meeting_url: meetingUrl,
      passcode: passcode || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Enter the MS Teams meeting URL and optional passcode
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-url">Meeting URL</Label>
            <Input
              id="meeting-url"
              placeholder="https://teams.microsoft.com/meet/..."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode (Optional)</Label>
            <Input
              id="passcode"
              placeholder="Enter passcode if required"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Bot'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
