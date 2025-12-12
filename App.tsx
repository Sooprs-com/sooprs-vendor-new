import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
// import AppRouter from './src/AppRouter';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
// import HomeDrawer from './src/ProfessionalScreens/Home/HomeDrawer';
import {useDispatch} from 'react-redux';
// import {checkForUpdate} from './src/services/AutoUpdate';
// import messaging from '@react-native-firebase/messaging';
// import { requestUserPermissionPushNotification } from './src/PushNotification';
// import { NotificationProvider, useNotification } from './src/contexts/NotificationContext';
// import CustomNotificationAlert from './src/components/CustomNotificationAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import AppRouter from './src/router/AppRouter';
import {Provider} from 'react-redux';
import store from './src/store/store';
import {getDataFromAsyncStorage} from './src/services/CommonFunction';
import {mobile_siteConfig} from './src/services/mobile-siteConfig';
import {getDataWithToken} from './src/services/mobile-api';

// Inner App component that uses notification context
const AppContent = () => {
  const dispatch = useDispatch();

  // Initialize user details in Redux store
  useEffect(() => {
    const initializeUserDetails = async () => {
      try {
        // First try to get from AsyncStorage
        const email = await getDataFromAsyncStorage(mobile_siteConfig.EMAIL);
        const slug = await getDataFromAsyncStorage(mobile_siteConfig.SLUG);
        
        // Try to fetch from API if token exists
        const token = await getDataFromAsyncStorage(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
        if (token) {
          try {
            const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
            const data: any = await res.json();
            
            if (data?.success && data?.vendorDetail) {
              dispatch({
                type: 'SET_USER_DETAILS',
                payload: {
                  email: data.vendorDetail.email || email || '',
                  mobile: data.vendorDetail.mobile || '',
                  name: data.vendorDetail.name || '',
                  slug: data.vendorDetail.slug || slug || '',
                  is_company: data.vendorDetail.is_company || '0',
                },
              });
              return;
            }
          } catch (error) {
            console.log('Error fetching user details from API:', error);
          }
        }
        
        // Fallback to AsyncStorage values
        if (email || slug) {
          dispatch({
            type: 'SET_USER_DETAILS',
            payload: {
              email: email || '',
              mobile: '',
              name: '',
              slug: slug || '',
              is_company: '0',
            },
          });
        }
      } catch (error) {
        console.log('Error initializing user details:', error);
      }
    };

    initializeUserDetails();
  }, [dispatch]);

  return (
    <>
      <NavigationContainer>
        <GestureHandlerRootView>
          <AppRouter/>
          {/* <HomeDrawer /> */}
        </GestureHandlerRootView>
      </NavigationContainer>
      {/* <CustomNotificationAlert /> */}
      <Toast />
    </>
  );
};

// Main App component wrapped with Redux Provider
const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
