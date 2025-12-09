import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import Images from '../assets/image';
import Home from '../Screen/Home/Home';
import Leads from '../Screen/Leads/Leads';
import Project from '../Screen/Projects/Project';
import Order from '../Screen/Orders/Order';
// import Projects from '../ProfessionalScreens/Projects/Projects';
// import AssignedProjects from '../ProfessionalScreens/Projects/AssignedProjects';
// import {useSelector} from 'react-redux';
// import ContactDetailScreen from './ContactDetailsScreen';
// import HomeDrawer from '../ProfessionalScreens/Home/HomeDrawer';
// import GigDrawer from '../UserScreens/Gigs/GigDrawer';
const iconSize = Math.min(wp(7), hp(4));
const BottomTab = () => {
  const Tab = createBottomTabNavigator();
  // const getUserDetails = useSelector(state => state?.getUserDetails);
  // const isCompany = getUserDetails?.is_company;
  // let flag = -1;
  // const selectedFlags = Array.from(
  //   new Set(getUserDetails?.services?.map(item => item.flag)),
  // ).sort((a, b) => a - b);
  // if (selectedFlags[selectedFlags.length - 1] <= 6) {
  //   flag = 1;
  // } else if (selectedFlags[selectedFlags.length - 1] > 6) {
  //   // taken 0 as non it
  //   flag = 0;
  // }
  const tabConfigs = [
    {
      name: 'Home',
      component: Home,
      icon: Images.home,
    },
    {
      name: 'Leads',
      component: Leads,
      icon: Images.projects,
    },
    {
      name: 'Projects',
      component: Project,
      icon: Images.phoneIcon1,
    },
    {
      name: 'Orders',
      component: Order,
      icon: Images.chat,
    },
  ].filter(Boolean);

  // Custom Tab Bar
  const MyTab = ({state, descriptors, navigation}: any) => {
    return (
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icon = tabConfigs[index]?.icon;
          // Handle tab press
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
              <Text style={[styles.label, isFocused && styles.focusedLabel]}>
                {route.name}
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
      {tabConfigs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
};

export default BottomTab;

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
    fontSize: hp(1.5),
    color: Colors.lightgrey2,
    marginTop: hp(0.5),
  },
  focusedLabel: {
    color: Colors.sooprsDark,
    fontWeight: '600',
  },
});
