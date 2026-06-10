import AsyncStorage from '@react-native-async-storage/async-storage';

export class ChatCacheService {
  /**
   * Caches message history for a specific channel
   * Limits cached history to 100 entries to optimize local storage size
   */
  static async saveMessages(channelId: string, messages: any[]): Promise<void> {
    try {
      const key = `CHAT_CACHE:messages:${channelId}`;
      const slice = messages.slice(-100);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(slice));
      } catch (err: any) {
        if (err.name === 'QuotaExceededError' || String(err.message).toLowerCase().includes('quota')) {
          const keys = await AsyncStorage.getAllKeys();
          const otherChatKeys = keys.filter((k) => k.startsWith('CHAT_CACHE:messages:') && k !== key);
          if (otherChatKeys.length > 0) {
            await AsyncStorage.multiRemove(otherChatKeys);
            await AsyncStorage.setItem(key, JSON.stringify(slice));
          } else {
            const allChatKeys = keys.filter((k) => k.startsWith('CHAT_CACHE:'));
            await AsyncStorage.multiRemove(allChatKeys);
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.warn('[ChatCacheService] saveMessages failed', err);
    }
  }

  /**
   * Retrieves cached message history for a specific channel
   */
  static async getMessages(channelId: string): Promise<any[]> {
    try {
      const key = `CHAT_CACHE:messages:${channelId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[ChatCacheService] getMessages failed', err);
      return [];
    }
  }

  /**
   * Caches the list of active channels/conversations
   */
  static async saveChannels(channels: any[]): Promise<void> {
    try {
      const key = 'CHAT_CACHE:channels_list';
      try {
        await AsyncStorage.setItem(key, JSON.stringify(channels));
      } catch (err: any) {
        if (err.name === 'QuotaExceededError' || String(err.message).toLowerCase().includes('quota')) {
          const keys = await AsyncStorage.getAllKeys();
          const chatMsgKeys = keys.filter((k) => k.startsWith('CHAT_CACHE:messages:'));
          if (chatMsgKeys.length > 0) {
            await AsyncStorage.multiRemove(chatMsgKeys);
            await AsyncStorage.setItem(key, JSON.stringify(channels));
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.warn('[ChatCacheService] saveChannels failed', err);
    }
  }

  /**
   * Retrieves the cached list of active channels
   */
  static async getChannels(): Promise<any[]> {
    try {
      const key = 'CHAT_CACHE:channels_list';
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[ChatCacheService] getChannels failed', err);
      return [];
    }
  }

  /**
   * Clears all cached chat keys on user logout
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter((k) => k.startsWith('CHAT_CACHE:'));
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
      }
    } catch (err) {
      console.warn('[ChatCacheService] clearCache failed', err);
    }
  }
}
