import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import LinearGradient from 'react-native-linear-gradient';

import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken, postDataWithTokenBase2 } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

const HomeVerificationScreen = () => {
    const navigation = useNavigation();
    const [userName, setUserName] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loadingUserDetails, setLoadingUserDetails] = useState(true);
    
    // Leads state variables
    const [leads, setLeads] = useState<any[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [categoryId, setCategoryId] = useState<string>('1');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expandedLeads, setExpandedLeads] = useState<Set<string | number>>(new Set());

  const getUserDetails = async () => {
    try {
      setLoadingUserDetails(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data in HomeVerification:::::', data);
      
      if (data?.success && data?.vendorDetail) {
        // Update user name from API response
        if (data.vendorDetail.name) {
          setUserName(data.vendorDetail.name);
        } else {
          setUserName('User');
        }
        
        // Set profile image from API response
        if (data.vendorDetail.image) {
          setProfileImage(data.vendorDetail.image);
        }
        
        // Get category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        }
      }
    } catch (err: any) {
      console.log('Error fetching user details in HomeVerification:::::', err);
      setUserName('User');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Get leads function
  const getLeads = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingLeads(true);
      }
      
      const payload = {
        category: categoryId,
        page: page,
        limit: 20,
        cur: "INR"
      };
      console.log('Payload Filter lead (HomeVerification):::::', payload);
      
      const result: any = await postDataWithTokenBase2(payload, mobile_siteConfig.FILTER_LEADS_ALL);
      console.log('Leads API response (HomeVerification, page', page, '):::::', result);
      
      let newLeads: any[] = [];
      
      if (result?.success && Array.isArray(result?.data)) {
        newLeads = result.data;
      } else if (result?.data && Array.isArray(result.data)) {
        newLeads = result.data;
      } else if (Array.isArray(result)) {
        newLeads = result;
      } else {
        console.log('Invalid leads response format:', result);
        newLeads = [];
      }
      
      if (append) {
        setLeads(prevLeads => [...prevLeads, ...newLeads]);
      } else {
        setLeads(newLeads);
      }
      
      if (newLeads.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
    } catch (error: any) {
      console.log('Error fetching leads (HomeVerification):::::', error);
      if (!append) {
        setLeads([]);
      }
    } finally {
      setLoadingLeads(false);
      setLoadingMore(false);
    }
  };

  const loadMoreLeads = () => {
    if (!loadingMore && hasMore && !loadingLeads) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getLeads(nextPage, true);
    }
  };

  const toggleDescription = (leadId: string | number) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore && !loadingMore && !loadingLeads) {
      loadMoreLeads();
    }
  };

  // Open drawer function
  const openDrawer = () => {
    (navigation as any).openDrawer();
  };

  // Fetch user details and leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getUserDetails();
        // Reset pagination when screen comes into focus
        setCurrentPage(1);
        setHasMore(true);
        // Small delay to ensure categoryId state is updated
        setTimeout(() => {
          getLeads(1, false);
        }, 100);
      };
      fetchData();
    }, [])
  );

  // Get image URI helper function
  const getImageUri = (imagePath: string | null): any => {
    if (imagePath) {
      return { uri: imagePath };
    }
    return Images.profileImage;
  };

  // Show loader while user details are loading
  if (loadingUserDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.userDetailsLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.userDetailsLoadingText}>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={"white"} />
      {/* ===== FIXED SECTION (Header + Verification Card) ===== */}
      <View style={styles.fixedSection}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={openDrawer} style={styles.drawerIconContainer}>
              <Image source={Images.drawer} style={styles.drawerIcon} />
            </TouchableOpacity>
            <Text style={styles.helloText}>Hello {userName || 'User'}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => (navigation as any).navigate('NotificationScreen')}>
              <Image source={Images.bellIcon} style={styles.bellIcon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => (navigation as any).navigate('ProfileScreen')}>
              <Image
                source={getImageUri(profileImage)}
                style={styles.profileImg}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerDivider} />
        
        {/* ===== BLUE VERIFICATION CARD ===== */}
        <LinearGradient
          colors={['#5D8FF3', '#2B67EC']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.card}
        >
          <View style={styles.cardTop}>
            <View style={styles.shieldBox}>
              <Image source={Images.shieldIcon} style={styles.shieldIcon} />
            </View>

            <View style={styles.actionBadge}>
              <Text style={styles.actionText}>Action Required</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Complete Verification</Text>

          <Text style={styles.cardDesc}>
            Upload your vehicle documents and driving license to start uploading your packages.
          </Text>

          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => (navigation as any).navigate("CompleteProfileScreen")}
          >
            <View style={styles.profileBtnRow}>
              <Text style={styles.profileBtnText}>Complete Profile</Text>

              <Image
                source={Images.rightArrowBlue}
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ===== SCROLLABLE SECTION (Leads) ===== */}
      <View style={styles.scrollableSection}>
        {/* ================= REQUESTS TITLE ================= */}
        <Text style={styles.reqTitle}>Requests</Text>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= EACH REQUEST CARD (Contact Button Disabled) ================= */}
          {loadingLeads ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.sooprsblue} />
              <Text style={styles.loadingText}>Loading leads...</Text>
            </View>
          ) : leads.length > 0 ? (
            <>
              {leads.map((lead, index) => {
                const leadId = lead.id || lead.lead_id || lead.leadId;
                const isExpanded = expandedLeads.has(leadId);
                const description = lead.description || lead.desc || 'The customer wants to book a cab trip.';
                const maxBudget = lead.max_budget_amount || lead.maxBudgetAmount || lead.max_budget || 'N/A';
                const lineCount = description.split('\n').length;
                const shouldTruncate = lineCount > 4 || description.length > 300;

                return (
                  <View key={leadId?.toString() || index.toString()} style={styles.reqCard}>
                    <Text style={styles.reqTitle2}>
                      {lead.project_title || lead.projectTitle || 'Project Title'}
                    </Text>

                    <Text style={styles.reqDesc} numberOfLines={isExpanded ? undefined : 4}>
                      {description}
                    </Text>

                    {shouldTruncate && (
                      <TouchableOpacity 
                        onPress={() => toggleDescription(leadId)}
                        style={styles.moreButton}
                      >
                        <Text style={styles.moreText}>
                          {isExpanded ? 'Less' : 'More'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.Desc}>
                      <Text style={[styles.reqDesc, {marginTop: 10, fontWeight: '600', color: Colors.gray}]}>Max Amount: </Text>
                      <Text style={styles.reqDate}>
                        ₹{typeof maxBudget === 'number' ? maxBudget.toLocaleString('en-IN') : maxBudget}
                      </Text>
                    </View>
                   
                    {/* Contact Button - Disabled */}
                    <TouchableOpacity 
                      style={[styles.getContactBtn, styles.getContactBtnDisabled]}
                      disabled={true}
                      activeOpacity={1}
                    >
                      <Text style={styles.getContactText}>Get Contact Details</Text>
                    </TouchableOpacity>
                    
                    {/* Info text for disabled button */}
                    <Text style={styles.disabledInfoText}>
                      Complete your profile verification to contact leads
                    </Text>
                  </View>
                );
              })}
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.sooprsblue} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leads available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(2),
    backgroundColor: Colors.white,
  },
  fixedSection: {
    backgroundColor: Colors.white,
  },
  scrollableSection: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(3),
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helloText: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginLeft: wp(3),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerIconContainer: {
    // Container for drawer icon
  },
  drawerIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.sooprsblue,
  },
  bellIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(3),
    tintColor: Colors.yellow,
  },
  profileImg: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(5),
  },

  // ===== BLUE CARD =====
  card: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
    backgroundColor: Colors.sooprsblue,
    padding: wp(5),
    borderRadius: wp(4),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shieldBox: {
    // Container for shield icon
  },
  shieldIcon: {
    width: wp(9),
    height: wp(9),
    tintColor: Colors.white,
  },
  actionBadge: {
   
    paddingHorizontal: wp(4),
  paddingVertical: hp(0.7),
  borderRadius: wp(3),
  backgroundColor: 'rgba(255,255,255,0.18)', // हल्का white-transparent
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.32)',    
  },
  actionText: {
    fontSize: FSize.fs11,
    fontWeight: '600',
    color: Colors.white,
  },

  cardTitle: {
    color: Colors.white,
    fontSize: FSize.fs18,
    fontWeight: '700',
    marginTop: hp(1.5),
  },

  cardDesc: {
    color: Colors.white,
    fontSize: FSize.fs12,
    marginTop: hp(1),
    lineHeight: hp(2.2),
    opacity: 0.9,
  },

  profileBtn: {
    backgroundColor: Colors.white,
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(2),
  },
  profileBtnRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
headerDivider: {
  width: '100%',
  height: hp(0.1),
  backgroundColor: Colors.lightgrey2, 
  marginTop: hp(0.3),
},

arrowIcon: {
  width: wp(5),     // size adjust
  height: wp(5),
  marginLeft: wp(2),
  tintColor: Colors.sooprsblue,   // same color as text
},

  profileBtnText: {
    color: Colors.sooprsblue,
    fontSize: FSize.fs14,
    fontWeight: '700',
  },

  // ===== CENTER IMAGE =====
  centerBox: {
    alignItems: 'center',
    marginTop: hp(14),
  },
  centerImage: {
    
    width: wp(60),
    height: hp(30),
    opacity: 1,
  },
  userDetailsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(50),
  },
  userDetailsLoadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs14,
    color: Colors.grey,
  },

  // ===== REQUEST SECTION =====
  reqTitle: {
    marginLeft: wp(5),
    marginTop: hp(1),
    marginBottom: hp(0.5),
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.gray,
  },
  reqCard: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    marginTop: hp(2),
    padding: wp(4),
    borderRadius: wp(3),
  },
  reqTitle2: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
  },
  Desc: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqDesc: {
    fontSize: FSize.fs14,
    marginTop: hp(1),
    color: Colors.black,
    lineHeight: hp(2.2),
  },
  reqDate: {
    marginTop: hp(1.4),
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  loadingContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    marginTop: hp(1),
  },
  loadingMoreContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    marginTop: hp(0.5),
  },
  emptyContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
  },
  moreButton: {
    marginTop: hp(0.5),
    alignSelf: 'flex-start',
  },
  moreText: {
    fontSize: FSize.fs12,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  getContactBtn: {
    width: '100%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    marginTop: hp(2),
  },
  getContactBtnDisabled: {
    backgroundColor: Colors.grey,
    opacity: 0.6,
  },
  getContactText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
  },
  disabledInfoText: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    textAlign: 'center',
    marginTop: hp(1),
    fontStyle: 'italic',
  },
});
