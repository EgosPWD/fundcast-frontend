import * as SecureStore from 'expo-secure-store';

// Native: the token lives in the platform keychain / keystore.
const KEY = 'fundcast.token';

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
