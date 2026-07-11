import React from 'react';
import {Dimensions, ScrollView} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTab from './BottomTab';
import BillingBottomTab from './BillingBottomTab';
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
import BillingScreen from '../Screen/Billing/BillingScreen';
import CreateCustomerScreen from '../Screen/Billing/CreateCustomerScreen';
import CreateInvoiceScreen from '../Screen/Billing/CreateInvoiceScreen';
import AllCustomersScreen from '../Screen/Billing/AllCustomersScreen';
import InvoicePreviewScreen from '../Screen/Billing/InvoicePreviewScreen';
import VideoCallScreen from '../Screen/VideoCall/VideoCallScreen';
import PackageDetailsScreen from '../Screen/Orders/PackageDetailsScreen';

const MainDrawer = createDrawerNavigator();
const {width} = Dimensions.get('window');
const VendorStack = createNativeStackNavigator();

const VendorStackNavigator = () => {
  return (
    <VendorStack.Navigator 
      screenOptions={{headerShown: false}}
      initialRouteName="BottomTab">
      <VendorStack.Screen name="BottomTab" component={BottomTab} />
      <VendorStack.Screen name="BillingBottomTab" component={BillingBottomTab} />
      <VendorStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <VendorStack.Screen name="PackagesScreen" component={Project} />
      <VendorStack.Screen name="BookingsScreen" component={Order} />
      <VendorStack.Screen name="AddCredits" component={AddCredits} />
      <VendorStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <VendorStack.Screen name="ChatSupportHome" component={ChatSupportHome} />
      <VendorStack.Screen name="NotificationScreen" component={NotificationScreen} />
      <VendorStack.Screen name="WebView" component={WebView} />
      <VendorStack.Screen name="PaymentMethodScreen" component={PaymentMethodScreen} />
      <VendorStack.Screen name="BillingScreen" component={BillingScreen} />
      <VendorStack.Screen name="CreateCustomerScreen" component={CreateCustomerScreen} />
      <VendorStack.Screen name="AllCustomersScreen" component={AllCustomersScreen} />
      <VendorStack.Screen name="CreateInvoiceScreen" component={CreateInvoiceScreen} />
      <VendorStack.Screen name="InvoicePreviewScreen" component={InvoicePreviewScreen} />
      <VendorStack.Screen name="PackageDetailsScreen" component={PackageDetailsScreen} />
      <VendorStack.Screen name="VideoCallScreen" component={VideoCallScreen} />
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

