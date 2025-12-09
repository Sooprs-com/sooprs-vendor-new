import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data to AsyncStorage
export const storeDataToAsyncStorage = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error storing data to AsyncStorage:', error);
    throw error;
  }
};

// Retrieve data from AsyncStorage (optional helper function)
export const getDataFromAsyncStorage = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error('Error retrieving data from AsyncStorage:', error);
    return null;
  }
};

