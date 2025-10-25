import { create } from 'zustand';
import { Bot } from '@/lib/api';

interface BotState {
  selectedBot: Bot | null;
  bots: Bot[];
  selectBot: (bot: Bot | null) => void;
  setBots: (bots: Bot[]) => void;
  updateBotStatus: (platform: string, native_id: string, status: string) => void;
}

export const useBotStore = create<BotState>((set) => ({
  selectedBot: null,
  bots: [],
  selectBot: (bot) => set({ selectedBot: bot }),
  setBots: (bots) => set({ bots }),
  updateBotStatus: (platform, native_id, status) =>
    set((state) => ({
      bots: state.bots.map((bot) =>
        bot.platform === platform && bot.native_meeting_id === native_id
          ? { ...bot, status }
          : bot
      ),
    })),
}));
