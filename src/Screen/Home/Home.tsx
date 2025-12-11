import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken, postDataWithTokenBase2 } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

const Home = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('Ankur');
  const [totalEarnings, setTotalEarnings] = useState('10,550');
  const [activeTrips, setActiveTrips] = useState(8);
  const [rating, setRating] = useState(4.9);

  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string | number>>(new Set());

  const getUserDetails = async () => {
    try {
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data:::::', data);
      
      // Check if profile is completed
      if (data?.success && data?.vendorDetail) {
        const isProfileCompleted = data.vendorDetail.is_profile_completed;
        
        // Update user name from API response
        if (data.vendorDetail.name) {
          setUserName(data.vendorDetail.name);
        }
        
        // Get category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        }
        
        // If profile is not completed (0), replace with HomeVerification screen
        if (isProfileCompleted === 0) {
          (navigation as any).replace('HomeVerification');
        }
        // If profile is completed (1), stay on Home screen (already here)
      }
    } catch (err: any) {
      console.log('Error fetching user details:::::', err);
    }
  };

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
        limit: 20
      };
      
      const result: any = await postDataWithTokenBase2(payload, mobile_siteConfig.FILTER_LEADS_ALL);
      console.log('Leads API response (page', page, '):::::', result);
      
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
        // Append new leads to existing ones
        setLeads(prevLeads => [...prevLeads, ...newLeads]);
      } else {
        // Replace leads for first page
        setLeads(newLeads);
      }
      
      // Check if there are more pages
      if (newLeads.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
    } catch (error: any) {
      console.log('Error fetching leads:::::', error);
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

  // Check profile status and fetch leads when screen comes into focus
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

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false}>
      

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello Ankur</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Image source={Images.bellIcon} style={styles.bellIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen' as never)}>
            <Image source={Images.profileImage} style={styles.profileImg} />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.headerDivider} />


      {/* ================= STATS BOX ================= */}

      <View style={styles.statsRow}>

        {/* Earnings */}
        <View style={styles.statCard}>
          <Image source={Images.walletIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>₹ 10,550</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>

        {/* Active Trips */}
        <View style={styles.statCard}>
          <Image source={Images.activeTripIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Active Trips</Text>
        </View>

        {/* Rating */}
        <View style={styles.statCard}>
          <Image source={Images.ratingStar} style={styles.statIcon} />
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>


      {/* ================= ADD PACKAGE LISTING ================= */}
      <TouchableOpacity style={styles.addListingBtn}
          onPress={() => (navigation as any).navigate("AddPackagesScreen")}
>
        <Text style={styles.addText}>+   Add New Package Listing</Text>
      </TouchableOpacity>


      {/* ================= REQUESTS TITLE ================= */}
      <Text style={styles.reqTitle}>Requests</Text>

      {/* ================= EACH REQUEST CARD ================= */}
      {loadingLeads ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : leads.length > 0 ? (
        <FlatList
          data={leads}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item: lead }) => {
            const leadId = lead.id || lead.lead_id || lead.leadId;
            const isExpanded = expandedLeads.has(leadId);
            const description = lead.description || lead.desc || 'The customer wants to book a cab trip.';
            const maxBudget = lead.max_budget_amount || lead.maxBudgetAmount || lead.max_budget || 'N/A';
            // Check if description needs truncation (more than 4 lines or very long)
            const lineCount = description.split('\n').length;
            const shouldTruncate = lineCount > 4 || description.length > 300;

            return (
              <View style={styles.reqCard}>
                <Text style={styles.reqTitle2}>
                  {lead.pickup_location || lead.pickupLocation || 'Pickup'} to {lead.dropoff_location || lead.dropoffLocation || 'Dropoff'} {lead.vehicle_type || lead.vehicleType || ''} Cab
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
                  <Text style={[styles.reqDesc, {marginTop: 10}]}>Max Amount:</Text>
                  <Text style={styles.reqDate}>
                    ₹{typeof maxBudget === 'number' ? maxBudget.toLocaleString('en-IN') : maxBudget}
                  </Text>
                </View>
               
                <View style={styles.reqBtnRow}>
                  <TouchableOpacity style={styles.ignoreBtn}>
                    <Text style={styles.ignoreText}>Ignore</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.acceptBtn}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          onEndReached={loadMoreLeads}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={Colors.sooprsblue} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leads available</Text>
        </View>
      )}

    </ScrollView>
  </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },
  /* ------------ HEADER ------------ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  helloText: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(3),
     tintColor: Colors.yellow, 
   
  },
  profileImg: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(5),
  },
headerDivider: {
  width: '100%',
  height: hp(0.1),
  backgroundColor: Colors.lightgrey2,
  marginTop: hp(0.5),
},

  /* ------------ STATS ------------ */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },

  statCard: {
    width: wp(28),
    backgroundColor: Colors.white,
    elevation: 3,
    borderRadius: wp(3),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  statIcon: {
    width: wp(8),
    height: wp(8),
    marginBottom: hp(1),
  },
  statValue: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.3),
  },

  /* ------------ Add New Package Button ------------ */
  addListingBtn: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    paddingVertical: hp(1.8),
    borderWidth: 1.5,
    borderColor: Colors.sooprsblue,
    borderRadius: wp(3),
     borderStyle: 'dashed', 
    alignItems: 'center',
  },
  addText: {
    fontSize: FSize.fs13,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },

  /* ------------ Request Section ------------ */
  reqTitle: {
    marginLeft: wp(5),
    marginTop: hp(2),
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },

  /* ------------ Request Cards ------------ */
  reqCard: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    elevation: 3,
    marginTop: hp(2),
    padding: wp(4),
    borderRadius: wp(3),
  },
  reqTitle2: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  Desc:{
     flexDirection: 'row',
    alignItems:'center',
    // marginTop: hp(1),
  },
  reqDesc: {
    fontSize: FSize.fs12,
    marginTop: hp(1),
    color: Colors.grey,
    lineHeight: hp(2.2),
  },
  reqDate: {
    marginTop: hp(1.4),
    fontSize: FSize.fs12,
    fontWeight: '500',
    color: Colors.darkGray,
  },

  reqBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  ignoreBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.grey,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  acceptBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
  },
  ignoreText: {
    fontSize: FSize.fs13,
    color: Colors.grey,
    fontWeight: '600',
  },
  acceptText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
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
});