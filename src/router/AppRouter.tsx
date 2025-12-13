import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import EnterMobileNumber from '../auth/EnterMobileNumber';
import NewOtpScreen from '../auth/NewOtpScreen';
import EmailCollectionScreen from '../auth/EmailCollectionScreen';
import BottomTab from './BottomTab';
import HomeVerificationScreen from '../Screen/Verification/HomeVerification';
// import RegistrationScreen from '../Screen/Home/Registration/RegistrationScreen';
import AddPackagesScreen from '../Screen/AddPackage/AddPackagesScreen';
import CabRideReviewScreen from '../Screen/CabDetails/CabRideDetailsScreen';
import ProfileScreen from '../Screen/Profile/ProfileScreen';
import EditProfileScreen from '../Screen/Profile/EditProfileScreen';
import RegistrationScreen from '../auth/RegistrationScreen';
import CompleteProfileScreen from '../Screen/CompleteProfile/CompleteProfileScreen';
import PackageDetailsScreen from '../Screen/Orders/PackageDetailsScreen';
import AddCredits from '../Screen/CreditScreen/AddCredits';
import SubscriptionScreen from '../Screen/SubscriptionScreen/SubscriptionScreen';
import WebView from '../Component/WebView';
// import WelcomeScreen from './auth/WelcomeScreen';
// import ProfileSelection from './auth/ProfileSelection';
// import Signup from './auth/Signup';
// import Login from './auth/Login';
// import EnterMobileNumber from './auth/EnterMobileNumber';
// import ForgotPassword from './auth/ForgotPassword';
// import RegisterSuccess from './auth/Success';
// import OtpScreen from './auth/OtpScreen';
// import Account from './ProfessionalScreens/Account/Account';
// import ManageDetails from './components/ManageDetails';
// import AddCredits from './components/AddCredits';
// import AddSkills from './components/AddSkills';
// import AddServices from './components/AddServices';
// import AddExperience from './components/AddExperience';
// import AddPortfolio from './components/AddPortfolio';
// import AddAcademics from './components/AddAcademics';
// import ManagePassword from './components/ManagePassword';
// import SubAccountProfile from './components/SubAccountProfile';
// import BankDetails from './components/BankDetails';
// import ManageExperience from './components/ManageExperience';
// import ManagePortfolio from './components/ManagePortfolio';
// import ManageResume from './components/ManageResume';
// import ManageAcademics from './components/ManageAcademics';
// import WebView from './components/WebView';
// import Refer from './components/Refer';
// import AssignedProjects from './ProfessionalScreens/Projects/AssignedProjects';
// import IndividualChat from './components/IndividualChat';
// import ProjectStatus from './components/ProjectStatus';
// import Projects from './ProfessionalScreens/Projects/Projects';
// import ProjectDetails from './components/ProjectDetails';
// import ContactDetailScreen from './components/ContactDetailsScreen';
// import Notifications from './components/Notifications';
// import ProfessionalProfile from './UserScreens/Profile/ProfessionalProfile';
// import ProfessionalBottomTab from './components/ProfessionalBottomTab';
// import UserCategories from './UserScreens/Categories/UserCategories';

// import Splash from './Splash';

// import ClientBottomTab from './components/ClientBottomTab';
// import ClientProfile from './UserScreens/Profile/ClientProfile';
// import ProjectPosting from './UserScreens/Projects/ProjectPosting';
// import Professionals from './UserScreens/Professionals/Professionals';
// import ClientHome from './UserScreens/Home/ClientHome';
// import ProjectBids from './UserScreens/Projects/ProjectBids';
// import ClientProjectDetails from './UserScreens/Projects/ClientProjectDetails';
// import CategoriesList from './components/CategoriesList';
// import GigDetails from './UserScreens/Gigs/GigDetails';
// import HomeDrawer from './ProfessionalScreens/Home/HomeDrawer';
// import GigSoldPurchased from './ProfessionalScreens/GigSalesAndPurchase/GigSoldPurchased';
// import Chat from './ChatSection/Chat';
// import SubscriptionScreen from './Subscriptions/SubscriptionScreen';
// import CreateGig from './UserScreens/Gigs/CreateGig';
// import MyGigs from './UserScreens/Gigs/MyGigs';
// import BrowseGigs from './UserScreens/Gigs/BrowseGigs';
// import UCBottomTab from './UrbanClapModule/Navigation/UCBottomTab';
// import AddressSelectionScreen from './UrbanClapModule/Screens/UCHome/AddressSelectionScreen';
// import ProductDetils from './UrbanClapModule/Screens/USProductDetails/ProductDetils';
// import ProfileSelection from './auth/ProfileSelection';
// import Signup from './auth/Signup';
// import Login from './auth/Login';


const Stack = createNativeStackNavigator();
const AuthenticationRouter = ({initialRoute}: {initialRoute?: string}) => {
  return (
    <Stack.Navigator 
      screenOptions={{headerShown: false}}
      initialRouteName={initialRoute || 'EnterMobileNumber'}>
      {/* <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} /> */}
      <Stack.Screen name="EnterMobileNumber" component={EnterMobileNumber} />
      <Stack.Screen name="NewOtpScreen" component={NewOtpScreen} />
      <Stack.Screen name="EmailCollectionScreen" component={EmailCollectionScreen} />
          <Stack.Screen name="HomeVerificationScreen" component={HomeVerificationScreen} />
          <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
          
           <Stack.Screen name="AddPackagesScreen" component={AddPackagesScreen} />
           <Stack.Screen name="CabRideReviewScreen" component={CabRideReviewScreen} />
           <Stack.Screen name="CompleteProfileScreen" component={CompleteProfileScreen} />
           <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
           <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
           <Stack.Screen name="AddCredits" component={AddCredits} />
           <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
           <Stack.Screen name="WebView" component={WebView} />
           <Stack.Screen name="PackageDetailsScreen" component={PackageDetailsScreen} />
      <Stack.Screen name="BottomTab" component={BottomTab} />
    
      {/* <Stack.Screen name="ProfileSelection" component={ProfileSelection} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Forgot" component={ForgotPassword} />
      <Stack.Screen name="Success" component={RegisterSuccess} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} /> */}
    </Stack.Navigator>
  );
};
// const AccountStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       <Stack.Screen name="AccountScreen" component={Account} />
//       <Stack.Screen name="ManageDetails" component={ManageDetails} />
//       <Stack.Screen name="AddCredits" component={AddCredits} />
//       <Stack.Screen name="AddSkills" component={AddSkills} />
//       <Stack.Screen name="AddServices" component={AddServices} />
//       <Stack.Screen name="AddExperience" component={AddExperience} />
//       <Stack.Screen name="AddPortfolio" component={AddPortfolio} />
//       <Stack.Screen name="AddAcademics" component={AddAcademics} />
//       <Stack.Screen name="ManagePassword" component={ManagePassword} />
//       <Stack.Screen name="SubAccount" component={SubAccountProfile} />
//       <Stack.Screen name="BankDetails" component={BankDetails} />
//       <Stack.Screen name="ManageExperience" component={ManageExperience} />
//       <Stack.Screen name="ManagePortfolio" component={ManagePortfolio} />
//       <Stack.Screen name="ManageResume" component={ManageResume} />
//       <Stack.Screen name="ManageAcademics" component={ManageAcademics} />
//       <Stack.Screen name="WebView" component={WebView} />

//       <Stack.Screen name="GigSoldPurchased" component={GigSoldPurchased} />
//       <Stack.Screen name="ContactDetails" component={ContactDetailScreen} />
//       <Stack.Screen name="MyGigs" component={MyGigs} />
//       <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
//       <Stack.Screen name="Chat" component={Chat} />
//     </Stack.Navigator>
//   );
// };
// const ProfessionalStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       {/* Home Stack */}
//       <Stack.Screen name="HomeDrawer" component={HomeDrawer} />
//       <Stack.Screen name="Notifications" component={Notifications} />
//       <Stack.Screen
//         name="ProfessionalProfile"
//         component={ProfessionalProfile}
//       />
//       {/* Assigned Projects */}
//       <Stack.Screen name="AssignedProjects" component={AssignedProjects} />
//       <Stack.Screen name="IndividualChat" component={IndividualChat} />
//       <Stack.Screen name="ProjectStatus" component={ProjectStatus} />
//       {/* Project stack */}
//       <Stack.Screen name="Projects" component={Projects} />
//       <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
//       {/* Contact details */}
//       <Stack.Screen name="ContactDetails" component={ContactDetailScreen} />
//       <Stack.Screen name="GigDetails" component={GigDetails} />
//       <Stack.Screen name="Refer" component={Refer} />
//     </Stack.Navigator>
//   );
// };
// Client stack
// const ClientStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       {/* Home stack */}
//       <Stack.Screen name="ClientHome" component={ClientHome} />
//       <Stack.Screen name="Notifications" component={Notifications} />
//       <Stack.Screen name="ClientProfile" component={ClientProfile} />
//       <Stack.Screen name="ProjectPosting" component={ProjectPosting} />
//       {/* project stack */}
//       <Stack.Screen name="ProjectsScreen" component={Projects} />
//       <Stack.Screen name="IndividualChat" component={IndividualChat} />
//       <Stack.Screen name="ProjectBids" component={ProjectBids} />
//       <Stack.Screen name="ClientProjectDetails" component={ClientProjectDetails} />
//       <Stack.Screen name="ProjectStatus" component={ProjectStatus} />
//       {/* professionals stack */}
//       <Stack.Screen name="ProfessionalsScreen" component={Professionals} />
//       <Stack.Screen
//         name="ProfessionalProfile"
//         component={ProfessionalProfile}
//       />
//       <Stack.Screen name="CategoriesList" component={CategoriesList} />
//       <Stack.Screen name="GigDetails" component={GigDetails} />
//     </Stack.Navigator>
//   );
// };


// const UrbanClapStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       <Stack.Screen
//         name="AddressSelectionScreen"
//         component={AddressSelectionScreen}
//       />
//       <Stack.Screen name="Products" component={ProductDetils} />
//     </Stack.Navigator>
//   );
// };


const AppRouter = ({initialRouteName}: {initialRouteName?: string}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {/* <Stack.Screen name="Splash" component={Splash} /> */}
      <Stack.Screen name="Authentication">
        {(props) => <AuthenticationRouter {...props} initialRoute={initialRouteName} />}
      </Stack.Screen>
      {/* <Stack.Screen name="ProfessionalStack" component={ProfessionalStack} />
      <Stack.Screen name="UrbanClapStack" component={UrbanClapStack} />
      <Stack.Screen name="AccountStack" component={AccountStack} />
      <Stack.Screen name="UserCategories" component={UserCategories} />
      <Stack.Screen name="BrowseGigs" component={BrowseGigs} />
      <Stack.Screen name="CreateGig" component={CreateGig} />
      <Stack.Screen name="UCBottomTab" component={UCBottomTab} />
      <Stack.Screen
        name="ProfessionalBottomTab"
        component={ProfessionalBottomTab}
      /> */}
      {/* <Stack.Screen name="ClientBottomTab" component={ClientBottomTab} /> */}
    </Stack.Navigator>
  );
};

export default AppRouter;

const styles = StyleSheet.create({});
