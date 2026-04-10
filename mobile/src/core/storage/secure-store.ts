import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

function hasWebStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && hasWebStorage()) {
    return globalThis.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && hasWebStorage()) {
    globalThis.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web' && hasWebStorage()) {
    globalThis.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const TokenStore = {
  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_KEY);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    await setItem(ACCESS_KEY, access);
    await setItem(REFRESH_KEY, refresh);
  },
  async clearTokens(): Promise<void> {
    await deleteItem(ACCESS_KEY);
    await deleteItem(REFRESH_KEY);
  },
};
