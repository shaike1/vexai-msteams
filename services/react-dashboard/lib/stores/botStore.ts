import { create } from 'zustand';
import { Bot } from '@/lib/api';

interface BotState {
  selectedBot: Bot | null;
  selectBot: (bot: Bot | null) => void;
}

export const useBotStore = create<BotState>((set) => ({
  selectedBot: null,
  selectBot: (bot) => set({ selectedBot: bot }),
}));
