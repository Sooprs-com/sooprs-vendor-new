import {
    StyleSheet,
    View,
    SectionList,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
    Linking,
  } from 'react-native';
  import React, {useState} from 'react';
  import Colors from '../assets/commonCSS/Colors';
  import NewHeader from './NewHeader';
//   import {WebView as RNWebView} from 'react-native-webview';
  import {hp, wp} from '../assets/commonCSS/GlobalCSS';
  import FSize from '../assets/commonCSS/FSize';
//   import {data} from './CombindedData';
//   import CustomButton from './CustomButton';
  import {postDataWithToken1} from '../services/mobile-api';
  import {mobile_siteConfig} from '../services/mobile-siteConfig';
//   import {GettingStarted} from './FAQ/GettingStarted';
  import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
  import Images from '../assets/image';
  import Toast from 'react-native-toast-message';
import { GettingStarted } from './FAQ/GettingStarted';
import Payment_Refund from './FAQ/Payment_Refund';
import Gig_Guide from './FAQ/Gig_Guide';
import Hire_Professional from './FAQ/Hire_Professional';
  const Top = createMaterialTopTabNavigator();
  const TopTab = () => {
    return (
      <Top.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarActiveTintColor: '#000066', // Active tab text color
          tabBarInactiveTintColor: 'rgba(132, 122, 122, 1)',
          tabBarLabelStyle: {
            fontSize: FSize.fs14, // Adjust the font size
            fontWeight: '700',
            flex: 1, // Set the font weight
            justifyContent: 'center',
            alignItems: 'center',
            width: wp(40),
          },
          tabBarStyle: {
            // height: hp(7),
            backgroundColor: 'white', // Set the height of the tab bar
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#000066',
            // marginHorizontal: wp(3),
            // marginRight:hp(3),
            // width: "35%",
          },
        }}>
        <Top.Screen name="Getting Started" component={GettingStarted} />
        <Top.Screen name="Payment & Refund" component={Payment_Refund} />
        <Top.Screen name="Gig Guide" component={Gig_Guide} />
        <Top.Screen name="Hire Professional" component={Hire_Professional} />
      </Top.Navigator>
    );
  };
  const TextComponent = ({placeholder, value, setValue}) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: '#999999',
          borderRadius: hp(1),
          width: '100%',
          height: placeholder === 'Message' ? hp(20) : hp(7),
        }}>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={val => setValue(val)}
          placeholderTextColor="#999999"
          multiline
          style={{
            paddingHorizontal: hp(2),
            color: 'black',
          }}
        />
      </View>
    );
  };
  const WebView = ({route, navigation}) => {
    const {header, webLink} = route?.params || {};
    console.log('header', header);
    const [inputData, setInputData] = useState({
      Name: '',
      Email: '',
      Phone: '',
      Message: '',
    });
  
    const PrivacyPolicy = [
      {
        title: 'Privacy Policy',
        data: [
          'This Privacy Policy relates to the collection, use and disclosure of personal data, including special or sensitive personal data, by Sooprs. “Sooprs”, “we“, or “our“ personal data is information relating to an individual (“you“ or “your“) as more fully defined herein below. Sooprs is committed to protecting your privacy and ensuring that you have a secured experience on our website and while using our products and services (collectively, “Products“). This policy covers the Sooprs website and all the subdomains under Sooprs.com . Please refer to the following link to read our terms of service Terms of service. This policy outlines, its subsidiaries and affiliated companies handling practices and how we collect and use the information you provide in the course of your use or access of our systems through online interfaces (e.g. website, mobile applications etc.) (collectively “Company Systems“). In this Privacy Policy, “Personal Data” means any information that can be used to individually identify a person and may include, but is not limited to, name, email address, postal or other physical addresses, title, and other personally identifiable information. By using our services or products, it will be deemed that you have read, understood and agreed to be bound by this policy detailed hereunder We will be the processor of the Personal Data that is provided, collected and/or processed pursuant to this policy, except where otherwise expressly stated.',
        ],
      },
      {
        title: 'Data Security',
        data: [
          'The information that you provide, subject to disclosure in accordance with this policy, shall be maintained in a safe and secure manner. Your information shall be protected, to a commercially reasonable extent, against unauthorized access, use, or disclosure. Our databases and information are stored on secure servers with appropriate firewalls. Further, we use vulnerability scanning and scanning to PCI standards annually and our Company Systems are subject to regular Malware Scanning. Additionally, we use SSL certificate to encrypt all the data being transferred. As a user of the Company Systems, you have the responsibility to ensure data security. You must not disclose to any person the authentication parameters that are assigned to you including Your username or password for your use of the Company Systems. You acknowledge that you will be solely responsible for all acts committed by use of your username /other authentication parameters. Given the nature of internet transactions, Sooprs does not take any responsibility for the transmission of information collected from you or are generated by your use of the Company Systems or the services. Any transmission of such information over the internet is done at your sole risk. Sooprs does not take any responsibility for you or any third party circumventing the privacy settings or security measures contained on the Company Systems. Notwithstanding anything to the contrary, while Sooprs will use all reasonable efforts to ensure that any information collected from you or are generated by your use of the Company Systems or the services is safe and secure, it offers no representations or warranties that the security measures are adequate, safe, fool proof or impenetrable.',
        ],
      },
      {
        title: 'Contact Us',
        data: [
          "If you have any questions about our policy or related dealings with us or would like further information about our services and practices, you can contact us at contact@Sooprs.com. For security concerns, please reach out to us at contact@Sooprs.com. This policy must be read in conjunction with the other agreements you may enter into with Sooprs and the ToS as published by Sooprs on Sooprs' website. By accepting the policy, you expressly consent to Sooprs' use and disclosure of your personal information in accordance with this policy.",
        ],
      },
      {
        title: 'Age Restrictions',
        data: [
          'You explicitly agree you are 18 years of age or older, unless represented by a parent or legal guardian. If you are not of the requisite age you must not provide any information to Sooprs directly or by way of usage of the Company Systems. If Sooprs determines that it is in possession of any information belonging to an individual below 18 years of age which is submitted, collected or generated in breach of the terms of this Policy, it will delete the same without any notice to the individual to whom such information belongs to.',
        ],
      },
    ];
  
    const RefundPolicy = [
      {
        title: 'Refund Policy Overview',
        data: [
          'At Sooprs, we are committed to providing exceptional value through our membership plans and premium services. Our services are designed to meet the needs of our users, and we strive to ensure a seamless and satisfying experience. Please read our refund policy carefully before making a purchase. By subscribing to our membership plans or premium services, you acknowledge and agree to the terms outlined below.',
        ],
      },
      {
        title: 'No Refund Policy',
        data: [
          'Given the nature of our services and the immediate value provided upon activation of a membership plan or premium service, we operate under a strict no-refund policy. Once a payment has been processed, it is considered final, and no refunds or exchanges will be issued.',
        ],
      },
      {
        title: 'Cancellation Policy',
        data: [
          'If you choose to discontinue your membership or premium services, you can cancel at any time. Please note that cancellation will not result in a refund for the unused portion of your subscription period.',
        ],
      },
      {
        title: 'Contact Us',
        data: [
          'If you have any questions or concerns about our refund policy, feel free to contact us at:',
          'Email: contact@sooprs.com',
          'This refund policy is subject to updates. Any changes will be reflected on this page. Please review this policy periodically to stay informed.',
        ],
      },
    ];
  
    const TermsAndConditions = [
      {
        title: 'Terms and Conditions',
        data: [
          'Welcome to Sooprs.com!',
          "These terms and conditions outline the rules and regulations for the use of Sooprs's Website, located at https://www.sooprs.com.",
          `By accessing this website we assume you accept these terms and conditions. Do not continue to use Sooprs.com if you do not agree to take all of the terms and conditions stated on this page.
             The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company's terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in accordance with and subject to, prevailing law of in. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.`,
        ],
      },
      {
        title: 'Cookies',
        data: [
          'We employ the use of cookies. By accessing Sooprs.com, you agreed to use cookies in agreement with the VGI Sooprs Technology PVT. LTD Privacy Policy.',
          "Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.",
        ],
      },
      {
        title: 'License',
        data: [
          `Unless otherwise stated, Sooprs and/or its licensors own the intellectual property rights for all material on Sooprs.com. All intellectual property rights are reserved. You may access this from Sooprs.com for your own personal use subjected to restrictions set in these terms and conditions.`,
          `You must not:`,
          `Republish material from Sooprs.com`,
          `Sell, rent or sub-license material from Sooprs.com`,
          `Reproduce, duplicate or copy material from Sooprs.com`,
          `Redistribute content from Sooprs.com`,
          `This Agreement shall begin on the date hereof. Our Terms and Conditions were created with the help of the Terms and Conditions Generator.`,
          `Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Sooprs does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Sooprs, its agents and/or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions. To the extent permitted by applicable laws, Sooprs shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.`,
          `Sooprs reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or cause breach of these Terms and Conditions.`,
          `You warrant and represent that:`,
          `You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;`,
          `The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party;`,
          `The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which is an invasion of privacy;`,
          `The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.`,
          `You hereby grant Sooprs a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media.`,
        ],
      },
      {
        title: 'Hyperlinking to our Content',
        data: [
          `The following organizations may link to our Website without prior written approval:`,
          `Government agencies;`,
          `Search engines;`,
          `News organizations;`,
          `Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and`,
          `System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Website.
          These organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party's site.
          We may consider and approve other link requests from the following types of organizations:`,
          `commonly-known consumer and/or business information sources;`,
          `dot.com community sites;`,
          `associations or other groups representing charities;`,
          `online directory distributors;`,
          `internet portals;`,
          `accounting, law and consulting firms; and`,
          `educational institutions and trade associations.`,
          `We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of Sooprs; and (d) the link is in the context of general resource information.`,
          `If you are one of the organizations listed in paragraph 2 above and are interested in linking to our website, you must inform us by sending an e-mail to Sooprs. Please include your name, your organization name, contact information as well as the URL of your site , a list of any URLs from which you intend to link to our Website, and a list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.`,
          `Approved organizations may hyperlink to our Website as follows:`,
          `By use of our corporate name; or`,
          `By use of the uniform resource locator being linked to; or`,
          `By use of any other description of our Website being linked to that makes sense within the context and format of content on the linking party's site`,
          `No use of Sooprs's logo or other artwork will be allowed for linking absent a trademark license agreement.`,
        ],
      },
      {
        title: 'iFrames',
        data: [
          'Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.',
        ],
      },
      {
        title: 'Content Liability',
        data: [
          'We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.',
        ],
      },
      {
        title: 'Reservation of Rights',
        data: [
          'We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.',
        ],
      },
      {
        title: 'Removal of links from our website',
        data: [
          `If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to or to respond to you directly.
        We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.`,
        ],
      },
      {
        title: 'Disclaimer',
        data: [
          'To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:',
          'limit or exclude our or your liability for death or personal injury;',
          'limit or exclude our or your liability for fraud or fraudulent misrepresentation;',
          'limit any of our or your liabilities in any way that is not permitted under applicable law; or',
          'exclude any of our or your liabilities that may not be excluded under applicable law.',
          `The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.`,
          `As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.`,
        ],
      },
    ];
  
    const SubmitFormApi = () => {
      if (
        !inputData.Name ||
        !inputData.Email ||
        !inputData.Phone ||
        !inputData.Message
      ) {
        Toast.show({
          type: 'info',
          text1: 'Incomplete form',
          text2: 'Please fill the form.',
        });
        return;
      } else if (
        !validateEmail(inputData.Email) ||
        !validateMobile(inputData.Phone)
      ) {
        Toast.show({
          type: 'info',
          text1: 'Invalid format',
          text2: !validateEmail(inputData.Email)
            ? 'Invalid email'
            : 'Invalid phone',
        });
        return;
      }
      const req = {
        name: inputData.Name,
        email: inputData.Email,
        phone: inputData.Phone,
        message: inputData.Message,
      };
      postDataWithToken1(req, mobile_siteConfig.CONTACT_US).then(res => {
        console.log('Response: ', res);
        Alert.alert('Success', 'Your message has been sent successfully!');
      });
    };
    //handle contact
    const handleContactPress = (index, item) => {
      let url;
      index == 0 ? (url = `tel:${item}`) : (url = `mailto:${item}`);
      try {
        Linking.openURL(url);
      } catch (error) {
        console.log('error', error);
      }
    };
    const validateEmail = email => {
      return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    };
    const validateMobile = phone => {
      return 7 <= phone?.length && 15 >= phone?.length;
    };
    return (
      <View style={styles.container1}>
        {/* Display custom header */}
        <NewHeader navigation={navigation} header={header} />
  
        <View style={styles.container}>
          {header !== 'Contact Us' && header !== 'FAQ' && (
            <SectionList
              sections={
                header === 'Privacy Policy'
                  ? PrivacyPolicy
                  : header === 'Refund Policy'
                  ? RefundPolicy
                  : header === 'Term & Condition'
                  ? TermsAndConditions
                  : ''
              }
              keyExtractor={(item, index) => item + index}
              renderItem={({item}) => <Text style={styles.item}>{item}</Text>}
              renderSectionHeader={({section: {title}}) => (
                <Text style={styles.header}>{title}</Text>
              )}
            />
          )}
          {/* Contect Us Section */}
          {header === 'Contact Us' && (
            <ScrollView>
              <Text
                style={{
                  fontSize: FSize.fs22,
                  fontWeight: '600',
                  color: 'black',
                }}>
                Get in Touch
              </Text>
              <Text
                style={{
                  color: 'black',
                  marginVertical: hp(2),
                }}>
                How can we help you? Please write down your query.
              </Text>
  
              <View
                style={{
                  gap: hp(3),
                  marginHorizontal: wp(3),
                }}>
                <TextComponent
                  value={inputData.Name}
                  setValue={val => {
                    setInputData({
                      ...inputData,
                      Name: val,
                    });
                  }}
                  placeholder={'Name'}
                />
                <TextComponent
                  value={inputData.Email}
                  setValue={val =>
                    setInputData({
                      ...inputData,
                      Email: val,
                    })
                  }
                  placeholder={'Email'}
                />
                <TextComponent
                  value={inputData.Phone}
                  setValue={val => {
                    setInputData({
                      ...inputData,
                      Phone: val,
                    });
                  }}
                  placeholder={'Phone'}
                />
                <TextComponent
                  value={inputData.Message}
                  setValue={val => {
                    setInputData({
                      ...inputData,
                      Message: val,
                    });
                  }}
                  placeholder={'Message'}
                />
                <TouchableOpacity
                  onPress={() => SubmitFormApi()}
                  style={{
                    backgroundColor: Colors.sooprsblue,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: hp(1.5),
                    borderRadius: hp(1),
                  }}
                  activeOpacity={0.8}>
                  <Text
                    style={{
                      fontSize: FSize.fs19,
                      fontWeight: '600',
                      color: 'white',
                    }}>
                    Send Message
                  </Text>
                </TouchableOpacity>
              </View>
  
              <View style={{alignSelf: 'center', marginVertical: 10}}>
                {['+91 9289839496', 'support@sooprs.in'].map((item, index) => {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={index}
                      style={{
                        borderColor: '#999999',
                        borderWidth: 1,
                        alignItems: 'center',
                        borderRadius: 10,
                        paddingHorizontal: 15,
                        paddingVertical: 8,
                        marginVertical: 5,
                        flexDirection: 'row',
                        width: wp(90),
                        justifyContent: 'center',
                      }}
                      onPress={() => handleContactPress(index, item)}>
                      <Image
                        source={index == 0 ? Images.phoneIcon1 : Images.emailIcon}
                        style={{height: 25, width: 25, marginRight: 20}}
                        resizeMode="contain"
                      />
                      <Text style={{color: Colors.black}}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
          {header == 'FAQ' && <TopTab />}
        </View>
      </View>
    );
  };
  
  export default WebView;
  
  const styles = StyleSheet.create({
    container1: {
      flex: 1,
      backgroundColor: Colors.white,
    },
    webView: {
      flex: 1,
    },
  
    container: {
      flex: 1,
      // backgroundColor: '#f8f8f8',
      padding: 10,
    },
    header: {
      fontSize: 18,
      color: 'black',
      fontWeight: 'bold',
      paddingVertical: 5,
      paddingHorizontal: 10,
      marginVertical: 5,
      borderRadius: 4,
    },
    item: {
      fontSize: FSize.fs15,
      color: 'black',
      lineHeight: 22,
      // padding: 10,
      paddingHorizontal: wp(3),
      // backgroundColor: '#ffffff',
      borderRadius: 4,
      marginVertical: 2,
    },
  });
  