import React from 'react';
import {Dimensions, ScrollView} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTab from './BottomTab';
import DrawerMenuScreen from '../Component/DrawerMenuScreen';
import ProfileScreen from '../Screen/Profile/ProfileScreen';
import AddCredits from '../Screen/CreditScreen/AddCredits';
import SubscriptionScreen from '../Screen/SubscriptionScreen/SubscriptionScreen';
import ChatSupportHome from '../Screen/Support/ChatSupportHome';
import NotificationScreen from '../Screen/Notifications/NotificationScreen';
import WebView from '../Component/WebView';
import Project from '../Screen/Projects/Project';
import Order from '../Screen/Orders/Order';
import PaymentMethodScreen from '../Screen/PaymentMethod/PaymentMethodScreen';

const MainDrawer = createDrawerNavigator();
const {width} = Dimensions.get('window');
const VendorStack = createNativeStackNavigator();

const VendorStackNavigator = () => {
  return (
    <VendorStack.Navigator 
      screenOptions={{headerShown: false}}
      initialRouteName="BottomTab">
      <VendorStack.Screen name="BottomTab" component={BottomTab} />
      <VendorStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <VendorStack.Screen name="PackagesScreen" component={Project} />
      <VendorStack.Screen name="BookingsScreen" component={Order} />
      <VendorStack.Screen name="AddCredits" component={AddCredits} />
      <VendorStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <VendorStack.Screen name="ChatSupportHome" component={ChatSupportHome} />
      <VendorStack.Screen name="NotificationScreen" component={NotificationScreen} />
      <VendorStack.Screen name="WebView" component={WebView} />
      <VendorStack.Screen name="PaymentMethodScreen" component={PaymentMethodScreen} />
    </VendorStack.Navigator>
  );
};

const ScrollableDrawerContent = ({children}: {children: React.ReactNode}) => {
  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
};

const VendorDrawer = () => {
  return (
    <MainDrawer.Navigator
      id="LeftDrawer"
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerStyle: {width: width * 0.85, overflow: 'hidden'},
      }}
      drawerContent={props => (
        <ScrollableDrawerContent>
          <DrawerMenuScreen {...props} />
        </ScrollableDrawerContent>
      )}>
      <MainDrawer.Screen
        name="VendorHomeScreen"
        component={VendorStackNavigator}
      />
    </MainDrawer.Navigator>
  );
};

export default VendorDrawer;

