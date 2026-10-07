import AsyncStorage from '@react-native-async-storage/async-storage';
import {mobile_siteConfig} from './mobile-siteConfig';

// Store data to AsyncStorage
export const storeDataToAsyncStorage = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    throw error;
  }
};

// Retrieve data from AsyncStorage (optional helper function)
export const getDataFromAsyncStorage = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    return null;
  }
};

export const persistVendorSession = async (
  result: any,
  fallbackEmail?: string,
): Promise<boolean> => {
  const token = result?.token || result?.data?.token || result?.accessToken;
  if (!token) {
    return false;
  }

  const user = result?.user || result?.data?.user || result?.vendor || {};
  const userId = result?.user_id || user?.id;
  const slug = result?.slug || user?.slug;
  const email = result?.email || user?.email || fallbackEmail;

  await storeDataToAsyncStorage(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
    String(token),
  );
  await storeDataToAsyncStorage(mobile_siteConfig.IS_LOGIN, 'TRUE');

  if (userId) {
    await storeDataToAsyncStorage(mobile_siteConfig.UID, String(userId));
  }
  if (slug) {
    await storeDataToAsyncStorage(mobile_siteConfig.SLUG, String(slug));
  }
  if (email) {
    await storeDataToAsyncStorage(mobile_siteConfig.EMAIL, String(email));
  }

  return true;
};

// Clear all AsyncStorage data (for logout)
export const clearAllAsyncStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    throw error;
  }
};

