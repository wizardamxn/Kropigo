import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'kropigo.auth-token';
let cachedToken: string | null = null;

export const getToken = () => cachedToken;

export async function hydrateToken() {
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

export async function saveToken(token: string) {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
