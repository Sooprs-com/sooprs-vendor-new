
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import {postDataWithTokenBase2, getDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getLeadVisual = (contact: any) => {
  const haystack = `${contact?.project_title || ''} ${contact?.pickup_location || ''} ${contact?.pickupLocation || ''} ${contact?.vehicle_type || ''} ${contact?.vehicleType || ''} ${contact?.category || ''} ${contact?.category_name || ''}`.toLowerCase();

  if (/cab|taxi|ride|travel|vehicle/.test(haystack)) {
    return {name: 'car', color: '#0077FF', bg: '#EEF4FF'};
  }
  if (/health|fitness|gym|yoga|wellness/.test(haystack)) {
    return {name: 'dumbbell', color: '#3B82F6', bg: '#EEF4FF'};
  }
  if (/mobile|app|android|ios/.test(haystack)) {
    return {name: 'cellphone', color: '#16A34A', bg: '#E8F8EF'};
  }
  if (/web|website|frontend|backend/.test(haystack)) {
    return {name: 'web', color: '#0284C7', bg: '#E0F2FE'};
  }
  if (/design|ui|ux|graphic/.test(haystack)) {
    return {name: 'palette-outline', color: '#DB2777', bg: '#FDF2F8'};
  }
  if (/market|seo|ads|social/.test(haystack)) {
    return {name: 'bullhorn-outline', color: '#D97706', bg: '#FFF7ED'};
  }
  if (/video|photo|edit/.test(haystack)) {
    return {name: 'video-outline', color: '#DC2626', bg: '#FEF2F2'};
  }
  return {name: 'briefcase-outline', color: '#0077FF', bg: '#EEF4FF'};
};

const getInitials = (name: string) => {
  const parts = String(name || 'C')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return String(name || 'C').slice(0, 2).toUpperCase();
};

const formatINR = (amount: any) => {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }
  const n = Number(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) {
    return String(amount);
  }
  return n.toLocaleString('en-IN');
};

const formatPosted = (dateString?: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return String(dateString);
  }

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const pickText = (...values: any[]) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '' && String(value).toLowerCase() !== 'null') {
      return String(value).trim();
    }
  }
  return '';
};

const MyLeadsScreen = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const getVendorId = async () => {
    if (vendorId) {
      return vendorId;
    }

    try {
      const cachedId = await AsyncStorage.getItem(mobile_siteConfig.UID);
      if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }

      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();

      if (data?.success && data?.vendorDetail?.id) {
        const id = String(data.vendorDetail.id);
        await AsyncStorage.setItem(mobile_siteConfig.UID, id);
        setVendorId(id);
        return id;
      } else if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }

      return null;
    } catch (error) {
      const cachedId = await AsyncStorage.getItem(mobile_siteConfig.UID);
      if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }
      return null;
    }
  };

  const getContactList = async (page: number = 1, append: boolean = false) => {
    const id = await getVendorId();

    if (!id) {
      setLoadingContacts(false);
      setLoadingMore(false);
      return;
    }

    const currentVendorId = id;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingContacts(true);
      }

      const formData = new FormData();
      formData.append('id', currentVendorId);
      formData.append('page', String(page));
      formData.append('limit', '20');

      const result: any = await postDataWithTokenBase2(formData, mobile_siteConfig.GET_CONTACT_LIST);

      let newContacts: any[] = [];

      if (result?.data?.records && Array.isArray(result.data.records)) {
        newContacts = result.data.records;
      } else if (result?.success !== undefined) {
        if (result.success && Array.isArray(result?.data)) {
          newContacts = result.data;
        } else if (result.success && Array.isArray(result?.contacts)) {
          newContacts = result.contacts;
        } else if (result.success && Array.isArray(result?.list)) {
          newContacts = result.list;
        } else if (Array.isArray(result?.data)) {
          newContacts = result.data;
        }
      } else if (Array.isArray(result?.data)) {
        newContacts = result.data;
      } else if (Array.isArray(result?.contacts)) {
        newContacts = result.contacts;
      } else if (Array.isArray(result?.list)) {
        newContacts = result.list;
      } else if (Array.isArray(result)) {
        newContacts = result;
      }

      if (append) {
        setContacts(prevContacts => [...prevContacts, ...newContacts]);
      } else {
        setContacts(newContacts);
      }

      setHasMore(newContacts.length >= 20);
    } catch (error: any) {
      if (!append) {
        setContacts([]);
      }
    } finally {
      setLoadingContacts(false);
      setLoadingMore(false);
    }
  };

  const loadMoreContacts = useCallback(() => {
    if (!loadingMore && hasMore && !loadingContacts) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getContactList(nextPage, true);
    }
  }, [loadingMore, hasMore, loadingContacts, currentPage]);

  useFocusEffect(
    useCallback(() => {
      setCurrentPage(1);
      setHasMore(true);
      getContactList(1, false);
    }, []),
  );

  const handleWhatsApp = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(whatsappUrl).catch(() => {
      const webUrl = `https://wa.me/${phoneNumber}`;
      Linking.openURL(webUrl);
    });
  };

  const handleCall = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderContactCard = ({item: contact}: {item: any}) => {
    const phone = pickText(contact.phone, contact.phone_number, contact.phoneNumber, contact.encrypted_mobile);
    const name = pickText(contact.name, contact.user_name, contact.userName) || 'Customer';
    const pickup = pickText(contact.pickup_location, contact.pickupLocation);
    const dropoff = pickText(contact.dropoff_location, contact.dropoffLocation);
    const vehicle = pickText(contact.vehicle_type, contact.vehicleType);
    const city = pickText(contact.city, contact.location, contact.area);
    const projectTitle = pickText(contact.project_title, contact.projectTitle, contact.category_name, contact.category);
    const minBudget = pickText(contact.min_budget, contact.min_budget_amount);
    const maxBudget = pickText(contact.max_budget_amount, contact.max_budget);
    const visual = getLeadVisual(contact);
    const posted = formatPosted(contact.created_at);

    const hasRoute = !!pickup && !!dropoff;
    const title = projectTitle || (hasRoute ? `${pickup} → ${dropoff}` : pickup || dropoff || city || 'Lead request');
    const showRoute = hasRoute && title !== `${pickup} → ${dropoff}`;
    const location =
      city && (!pickup || city.toLowerCase() !== pickup.toLowerCase())
        ? city
        : pickup && !hasRoute
          ? pickup
          : '';
    const budgetText =
      minBudget && maxBudget
        ? `₹${formatINR(minBudget)} – ₹${formatINR(maxBudget)}`
        : maxBudget
          ? `₹${formatINR(maxBudget)}`
          : minBudget
            ? `₹${formatINR(minBudget)}+`
            : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.leadIconBox, {backgroundColor: visual.bg}]}>
            <MaterialCommunityIcons name={visual.name} size={wp(6)} color={visual.color} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.titleMetaRow}>
              {vehicle ? (
                <View style={styles.vehicleChip}>
                  <MaterialCommunityIcons name="car-side" size={wp(4)} color="#2563EB" />
                  <Text style={styles.vehicleText} numberOfLines={1}>
                    {vehicle}
                  </Text>
                </View>
              ) : null}
              {posted ? (
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={wp(3.8)} color="#94A3B8" />
                  <Text style={styles.timeText}>{posted}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {showRoute ? (
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={styles.routeDotStart} />
              <Text style={styles.routeText} numberOfLines={1}>
                {pickup}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={wp(4.4)} color="#94A3B8" />
            <View style={[styles.routePoint, styles.routePointEnd]}>
              <View style={styles.routeDotEnd} />
              <Text style={styles.routeText} numberOfLines={1}>
                {dropoff}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.detailsRow}>
          <View style={styles.customerBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName} numberOfLines={1}>
                {name}
              </Text>
              {location ? (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={wp(4)} color="#64748B" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {budgetText ? (
            <View style={styles.budgetBox}>
              <Text style={styles.budgetCaption}>Budget</Text>
              <Text style={styles.budgetValue} numberOfLines={2}>
                {budgetText}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.whatsappButton, !phone && styles.actionDisabled]}
            onPress={() => phone && handleWhatsApp(phone)}
            activeOpacity={0.8}
            disabled={!phone}>
            <MaterialCommunityIcons name="whatsapp" size={wp(5.4)} color="#16A34A" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactButton, !phone && styles.actionDisabled]}
            onPress={() => phone && handleCall(phone)}
            activeOpacity={0.8}
            disabled={!phone}>
            <MaterialCommunityIcons name="phone" size={wp(5.2)} color={Colors.white} />
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore && hasMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={Colors.sooprsblue} />
          <Text style={styles.loadingMoreText}>Loading more leads...</Text>
        </View>
      );
    }
    return <View style={{height: hp(2)}} />;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="inbox-outline" size={wp(12)} color="#93C5FD" />
      </View>
      <Text style={styles.emptyText}>No leads yet</Text>
      <Text style={styles.emptySubText}>Unlocked customer contacts will appear here</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>My Leads</Text>
          <Text style={styles.headerSubtitle}>Reach customers via call or WhatsApp</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{contacts.length}</Text>
        </View>
      </View>

      {loadingContacts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) =>
            item.id?.toString() || item.contact_id?.toString() || index.toString()
          }
          renderItem={renderContactCard}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            contacts.length === 0 ? styles.emptyListContent : styles.listContent
          }
        />
      )}
    </View>
  );
};

export default MyLeadsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4.5),
    paddingTop:
      Platform.OS === 'ios'
        ? hp(6.5)
        : (StatusBar.currentHeight || hp(3)) + hp(1.4),
    paddingBottom: hp(1.6),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
  },
  headerTextWrap: {
    flex: 1,
    marginRight: wp(2),
  },
  headerTitle: {
    fontSize: FSize.fs22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: FSize.fs14,
    color: '#64748B',
    marginTop: hp(0.25),
    fontWeight: '500',
  },
  countBadge: {
    minWidth: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2.4),
  },
  countBadgeText: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: Colors.sooprsblue,
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.6),
    paddingBottom: hp(2.4),
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
  },
  card: {
    backgroundColor: Colors.white,
    marginBottom: hp(1.6),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(1.6),
    borderRadius: wp(4.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#1E40AF',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
        shadowColor: '#1E40AF',
      },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leadIconBox: {
    width: wp(11.5),
    height: wp(11.5),
    borderRadius: wp(3.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: hp(0.15),
  },
  title: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: hp(2.7),
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: hp(0.7),
    gap: wp(2),
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: wp(1.8),
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.4),
    gap: wp(1.2),
    maxWidth: wp(42),
  },
  vehicleText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: '#2563EB',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
  },
  timeText: {
    fontSize: FSize.fs13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2.8),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.05),
    gap: wp(1.8),
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: wp(1.6),
  },
  routePointEnd: {
    justifyContent: 'flex-end',
  },
  routeDotStart: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: '#22C55E',
  },
  routeDotEnd: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: '#EF4444',
  },
  routeText: {
    flex: 1,
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#334155',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    gap: wp(2.4),
  },
  customerBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(5.25),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.6),
  },
  avatarText: {
    fontSize: FSize.fs14,
    fontWeight: '800',
    color: '#2563EB',
  },
  customerMeta: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.35),
    gap: wp(0.8),
  },
  locationText: {
    flex: 1,
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '500',
  },
  budgetBox: {
    maxWidth: wp(36),
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    borderRadius: wp(2.6),
    paddingHorizontal: wp(2.8),
    paddingVertical: hp(0.8),
  },
  budgetCaption: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  budgetValue: {
    marginTop: hp(0.2),
    fontSize: FSize.fs14,
    fontWeight: '800',
    color: '#16A34A',
    textAlign: 'right',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: hp(1.6),
    marginBottom: hp(1.3),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(2.4),
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: wp(3),
    paddingVertical: hp(1.25),
  },
  whatsappText: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: '#16A34A',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
    backgroundColor: '#0077FF',
    borderRadius: wp(3),
    paddingVertical: hp(1.25),
  },
  contactText: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: Colors.white,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  loadingContainer: {
    flex: 1,
    padding: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FSize.fs16,
    color: '#64748B',
    marginTop: hp(1.2),
    fontWeight: '600',
  },
  loadingMoreContainer: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FSize.fs13,
    color: '#64748B',
    marginTop: hp(0.6),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
    paddingTop: hp(10),
  },
  emptyIconWrap: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.6),
  },
  emptyText: {
    fontSize: FSize.fs18,
    color: '#0F172A',
    fontWeight: '800',
  },
  emptySubText: {
    fontSize: FSize.fs14,
    color: '#94A3B8',
    marginTop: hp(0.6),
    textAlign: 'center',
    fontWeight: '500',
  },
});
