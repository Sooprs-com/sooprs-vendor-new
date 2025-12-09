import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
// import AppRouter from './src/AppRouter';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
// import HomeDrawer from './src/ProfessionalScreens/Home/HomeDrawer';
// import {useDispatch} from 'react-redux';
// import {checkForUpdate} from './src/services/AutoUpdate';
// import messaging from '@react-native-firebase/messaging';
// import { requestUserPermissionPushNotification } from './src/PushNotification';
// import { NotificationProvider, useNotification } from './src/contexts/NotificationContext';
// import CustomNotificationAlert from './src/components/CustomNotificationAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import AppRouter from './src/router/AppRouter';

// Inner App component that uses notification context
const AppContent = () => {
 

  // Check for pending background notifications


  
    
    // Initialize app without the default notification handler
    // We'll handle notifications with our custom alert
    
    // Request permissi



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

// Main App component wrapped with NotificationProvider
const App = () => {
  return (
      <AppContent />
  );
};

export default App;
