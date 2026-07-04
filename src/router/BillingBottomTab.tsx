import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import Images from '../assets/image';
import BillingScreen from '../Screen/Billing/BillingScreen';
import CreateCustomerScreen from '../Screen/Billing/CreateCustomerScreen';
import AllCustomersScreen from '../Screen/Billing/AllCustomersScreen';
import CreateInvoiceScreen from '../Screen/Billing/CreateInvoiceScreen';

const iconSize = Math.min(wp(7), hp(4));
const Tab = createBottomTabNavigator();

const billingTabConfigs = [
  {
    name: 'Billing',
    component: BillingScreen,
    icon: Images.dollarIcon,
    label: 'Billing',
  },
  {
    name: 'CreateCustomer',
    component: CreateCustomerScreen,
    icon: Images.UserRoundIcon,
    label: 'Create Customer',
  },
  {
    name: 'AllCustomers',
    component: AllCustomersScreen,
    icon: Images.accountIcon,
    label: 'All Customers',
  },
  {
    name: 'CreateInvoice',
    component: CreateInvoiceScreen,
    icon: Images.projectsIcon,
    label: 'Create Invoice',
  },
];

const BillingBottomTab = () => {
  const MyTab = ({state, descriptors, navigation}: any) => {
    return (
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = billingTabConfigs[index];
          const icon = config?.icon;
          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem]}>
              {isFocused && <View style={styles.activeBorder} />}
              <Image
                source={icon}
                style={[styles.icon, isFocused && styles.focusedIcon]}
                resizeMode="contain"
              />
              <Text
                style={[styles.label, isFocused && styles.focusedLabel]}
                numberOfLines={1}>
                {config?.label || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      tabBar={props => <MyTab {...props} />}>
      {billingTabConfigs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{tabBarLabel: tab.label}}
        />
      ))}
    </Tab.Navigator>
  );
};

export default BillingBottomTab;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: hp(1.4),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightgrey2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: iconSize,
    height: iconSize,
    tintColor: Colors.lightgrey2,
  },
  focusedIcon: {
    tintColor: Colors.sooprsDark,
  },
  activeBorder: {
    position: 'absolute',
    top: -hp(1.4),
    height: 3,
    width: '100%',
    backgroundColor: Colors.sooprsDark,
  },
  label: {
    fontSize: hp(1.2),
    color: Colors.lightgrey2,
    marginTop: hp(0.5),
  },
  focusedLabel: {
    color: Colors.sooprsDark,
    fontWeight: '600',
  },
});
