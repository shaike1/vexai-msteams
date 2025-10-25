import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18056';

export interface Bot {
  id: number;
  platform: string;
  native_meeting_id: string;
  status: string;
  created_at?: string;
  bot_container_id?: string;
  end_time?: string;
}

export interface Transcript {
  id: number;
  meeting_id: number;
  text: string;
  speaker?: string;
  timestamp?: string;
  start_time?: number;
  end_time?: number;
  absolute_start_time?: string;
  absolute_end_time?: string;
}

export const botApi = {
  // Get all bots
  async getBots(): Promise<Bot[]> {
    const response = await axios.get(`${API_URL}/bots/status`);
    return response.data.running_bots || [];
  },

  // Get single bot by ID
  async getBotById(id: string): Promise<Bot> {
    const response = await axios.get(`${API_URL}/bots/${id}`);
    return response.data;
  },

  // Create new bot
  async createBot(data: {
    platform: string;
    meeting_url: string;
    passcode?: string;
  }): Promise<Bot> {
    const response = await axios.post(`${API_URL}/bots`, {
      platform: data.platform,
      native_meeting_id: data.meeting_url,
      passcode: data.passcode,
    });
    return response.data;
  },

  // Stop bot
  async stopBot(platform: string, native_meeting_id: string): Promise<void> {
    await axios.delete(`${API_URL}/bots/${platform}/${native_meeting_id}`);
  },

  // Get transcripts for a bot
  async getTranscripts(platform: string, native_meeting_id: string): Promise<Transcript[]> {
    try {
      const response = await axios.get(`${API_URL}/transcripts/${platform}/${native_meeting_id}`);
      return response.data.transcripts || [];
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      return [];
    }
  },

  // Get container logs
  async getContainerLogs(containerId: string): Promise<string> {
    try {
      const response = await axios.get(`${API_URL}/containers/${containerId}/logs`);
      return response.data.logs || '';
    } catch (error) {
      console.error('Error fetching container logs:', error);
      return 'Logs unavailable';
    }
  },
};
