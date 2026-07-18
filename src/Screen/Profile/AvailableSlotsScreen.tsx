import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Images from '../../assets/image';
import {
  AvailabilitySlot,
  BlockedDate,
  DAY_LABELS,
  DAY_LABELS_SHORT,
  checkAppointmentAllowed,
  createDefaultWeekSchedule,
  fetchBlockedDates,
  fetchVendorAvailability,
  formatMonthKey,
  formatTimeDisplay,
  getActiveSlotsForSave,
  blockDates,
  mergeAvailabilityWithWeek,
  saveVendorAvailability,
  unblockDates,
} from '../../services/vendorAvailabilityApi';

type SetupTab = 'schedule' | 'blocked';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_ACCENTS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
];

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: {
    elevation: 3,
  },
  default: {},
});

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const SlotSetupModal = ({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<SetupTab>('schedule');
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<AvailabilitySlot[]>(
    createDefaultWeekSchedule(),
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('Holiday');
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  const monthKey = formatMonthKey(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
  );

  const blockedDateSet = useMemo(
    () => new Set(blockedDates.map(item => item.date)),
    [blockedDates],
  );

  const loadSchedule = useCallback(async () => {
    try {
      setLoadingSchedule(true);
      const result = await fetchVendorAvailability();
      setWeekSchedule(mergeAvailabilityWithWeek(result.availability));
    } catch (error) {
      console.log('loadSchedule error', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load weekly schedule',
        position: 'top',
      });
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  const loadBlockedDates = useCallback(async () => {
    try {
      setLoadingBlocked(true);
      const result = await fetchBlockedDates(monthKey);
      setBlockedDates(result.blockedDates);
    } catch (error) {
      console.log('loadBlockedDates error', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load blocked dates',
        position: 'top',
      });
    } finally {
      setLoadingBlocked(false);
    }
  }, [monthKey]);

  const initializeModal = useCallback(async () => {
    try {
      setCheckingAccess(true);
      console.log('[Add Slot] initializeModal — starting API calls');
      const allowed = await checkAppointmentAllowed();
      setAccessAllowed(allowed);
      if (!allowed) {
        return;
      }
      await Promise.all([loadSchedule(), loadBlockedDates()]);
    } catch (error) {
      console.log('initializeModal error', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to verify appointment settings',
        position: 'top',
      });
    } finally {
      setCheckingAccess(false);
    }
  }, [loadBlockedDates, loadSchedule]);

  useEffect(() => {
    if (visible) {
      setActiveTab('schedule');
      initializeModal();
    }
  }, [visible, initializeModal]);

  useEffect(() => {
    if (visible && accessAllowed && activeTab === 'blocked') {
      loadBlockedDates();
    }
  }, [activeTab, accessAllowed, loadBlockedDates, visible]);

  const updateDaySlot = (
    dayOfWeek: number,
    patch: Partial<AvailabilitySlot>,
  ) => {
    setWeekSchedule(prev =>
      prev.map(slot =>
        slot.dayOfWeek === dayOfWeek ? {...slot, ...patch} : slot,
      ),
    );
  };

  const handleSaveSchedule = async () => {
    const activeSlots = getActiveSlotsForSave(weekSchedule);
    for (const slot of activeSlots) {
      const timePattern = /^\d{2}:\d{2}$/;
      if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime)) {
        Alert.alert(
          'Invalid time',
          `Please use HH:mm format for ${DAY_LABELS[slot.dayOfWeek]}.`,
        );
        return;
      }
      if (slot.slotDurationMinutes < 5 || slot.slotDurationMinutes > 180) {
        Alert.alert(
          'Invalid duration',
          'Slot duration must be between 5 and 180 minutes.',
        );
        return;
      }
    }

    try {
      setSavingSchedule(true);
      const result: any = await saveVendorAvailability(activeSlots);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to save schedule');
      }
      onSaved();
      onClose();
      // Toast is rendered at the app root, so show it after the modal closes
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Schedule Saved',
          text2: 'Weekly schedule updated successfully',
          position: 'top',
        });
      }, 350);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to save schedule',
        position: 'top',
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDatePress = async (dateKey: string) => {
    if (togglingDate) {
      return;
    }

    try {
      setTogglingDate(dateKey);
      if (blockedDateSet.has(dateKey)) {
        const result: any = await unblockDates([dateKey]);
        if (result?.success === false) {
          throw new Error(result?.message || 'Failed to unblock date');
        }
        setBlockedDates(prev => prev.filter(item => item.date !== dateKey));
        Toast.show({
          type: 'success',
          text1: 'Unblocked',
          text2: `${dateKey} is available again`,
          position: 'top',
        });
      } else {
        const reason = blockReason.trim() || 'Holiday';
        const result: any = await blockDates([dateKey], reason);
        if (result?.success === false) {
          throw new Error(result?.message || 'Failed to block date');
        }
        setBlockedDates(prev => [...prev, {date: dateKey, reason}]);
        Toast.show({
          type: 'success',
          text1: 'Blocked',
          text2: `${dateKey} marked as leave`,
          position: 'top',
        });
      }
      onSaved();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Could not update blocked date',
        position: 'top',
      });
    } finally {
      setTogglingDate(null);
    }
  };

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{key: string; label: string; dateKey?: string}> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({key: `empty-${i}`, label: ''});
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({key: dateKey, label: String(day), dateKey});
    }

    return cells;
  }, [calendarMonth]);

  const changeMonth = (offset: number) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={Colors.black}
            />
          </TouchableOpacity>
          <View style={styles.modalTitleWrap}>
            <Text style={styles.modalTitle}>Manage Slots</Text>
            <Text style={styles.modalSubtitle}>Set hours & blocked dates</Text>
          </View>
          <View style={styles.modalCloseBtn} />
        </View>

        {checkingAccess ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.sooprsblue} />
            <Text style={styles.loadingText}>Verifying access...</Text>
          </View>
        ) : !accessAllowed ? (
          <View style={styles.centerContent}>
            <View style={styles.accessDeniedIcon}>
              <MaterialCommunityIcons
                name="calendar-lock"
                size={36}
                color={Colors.sooprsblue}
              />
            </View>
            <Text style={styles.accessDeniedTitle}>Appointment booking not enabled</Text>
            <Text style={styles.accessDeniedText}>
              Your profile must have appointment booking enabled before you can manage
              availability slots.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'schedule' && styles.tabButtonActive]}
                onPress={() => setActiveTab('schedule')}>
                <MaterialCommunityIcons
                  name="calendar-week"
                  size={16}
                  color={activeTab === 'schedule' ? Colors.sooprsblue : Colors.grey}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'schedule' && styles.tabButtonTextActive,
                  ]}>
                  Weekly Schedule
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'blocked' && styles.tabButtonActive]}
                onPress={() => setActiveTab('blocked')}>
                <MaterialCommunityIcons
                  name="calendar-remove"
                  size={16}
                  color={activeTab === 'blocked' ? Colors.sooprsblue : Colors.grey}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'blocked' && styles.tabButtonTextActive,
                  ]}>
                  Blocked Dates
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'schedule' ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.helperCard}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={Colors.sooprsblue}
                  />
                  <Text style={styles.helperText}>
                    Set your weekly hours. This schedule repeats every week automatically.
                  </Text>
                </View>

                {loadingSchedule ? (
                  <ActivityIndicator
                    size="large"
                    color={Colors.sooprsblue}
                    style={styles.inlineLoader}
                  />
                ) : (
                  weekSchedule.map(slot => (
                    <View
                      key={slot.dayOfWeek}
                      style={[
                        styles.dayCard,
                        slot.isActive && styles.dayCardActive,
                        !slot.isActive && styles.dayCardInactive,
                      ]}>
                      <View style={styles.dayToggleRow}>
                        <View
                          style={[
                            styles.dayBadge,
                            {backgroundColor: DAY_ACCENTS[slot.dayOfWeek]},
                          ]}>
                          <Text style={styles.dayBadgeText}>
                            {DAY_LABELS_SHORT[slot.dayOfWeek]}
                          </Text>
                        </View>
                        <View style={styles.dayToggleInfo}>
                          <Text style={styles.dayLabel}>{DAY_LABELS[slot.dayOfWeek]}</Text>
                          <Text style={styles.dayStatusText}>
                            {slot.isActive ? 'Available for bookings' : 'Day off'}
                          </Text>
                        </View>
                        <Switch
                          value={slot.isActive}
                          onValueChange={value =>
                            updateDaySlot(slot.dayOfWeek, {isActive: value})
                          }
                          trackColor={{false: '#E2E8F0', true: '#B3D9FF'}}
                          thumbColor={slot.isActive ? Colors.sooprsblue : '#F8FAFC'}
                        />
                      </View>

                      {slot.isActive ? (
                        <View style={styles.dayFields}>
                          <View style={styles.timeFieldGroup}>
                            <Text style={styles.fieldLabel}>Start time</Text>
                            <View style={styles.inputWithIcon}>
                              <MaterialCommunityIcons
                                name="clock-outline"
                                size={16}
                                color={Colors.grey}
                              />
                              <TextInput
                                style={styles.timeInput}
                                value={slot.startTime}
                                onChangeText={value =>
                                  updateDaySlot(slot.dayOfWeek, {startTime: value})
                                }
                                placeholder="10:00"
                                placeholderTextColor="#A0AEC0"
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                              />
                            </View>
                          </View>
                          <View style={styles.timeSeparator}>
                            <MaterialCommunityIcons
                              name="arrow-right"
                              size={16}
                              color={Colors.grey}
                            />
                          </View>
                          <View style={styles.timeFieldGroup}>
                            <Text style={styles.fieldLabel}>End time</Text>
                            <View style={styles.inputWithIcon}>
                              <MaterialCommunityIcons
                                name="clock-outline"
                                size={16}
                                color={Colors.grey}
                              />
                              <TextInput
                                style={styles.timeInput}
                                value={slot.endTime}
                                onChangeText={value =>
                                  updateDaySlot(slot.dayOfWeek, {endTime: value})
                                }
                                placeholder="14:00"
                                placeholderTextColor="#A0AEC0"
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                              />
                            </View>
                          </View>
                          <View style={styles.durationFieldGroup}>
                            <Text style={styles.fieldLabel}>Duration</Text>
                            <View style={styles.inputWithIcon}>
                              <MaterialCommunityIcons
                                name="timer-outline"
                                size={16}
                                color={Colors.grey}
                              />
                              <TextInput
                                style={styles.timeInput}
                                value={String(slot.slotDurationMinutes)}
                                onChangeText={value =>
                                  updateDaySlot(slot.dayOfWeek, {
                                    slotDurationMinutes:
                                      Number(value.replace(/[^0-9]/g, '')) || 0,
                                  })
                                }
                                keyboardType="number-pad"
                                maxLength={3}
                              />
                              <Text style={styles.durationSuffix}>min</Text>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}

                <TouchableOpacity
                  style={[styles.saveButton, savingSchedule && styles.saveButtonDisabled]}
                  onPress={handleSaveSchedule}
                  disabled={savingSchedule || loadingSchedule}
                  activeOpacity={0.85}>
                  {savingSchedule ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="content-save-outline"
                        size={20}
                        color={Colors.white}
                      />
                      <Text style={styles.saveButtonText}>Save Schedule</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.helperCard}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={Colors.sooprsblue}
                  />
                  <Text style={styles.helperText}>
                    Tap a date to block it. Tap a blocked date again to unblock.
                  </Text>
                </View>

                <View style={[styles.calendarCard, cardShadow]}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      onPress={() => changeMonth(-1)}
                      style={styles.monthNavBtn}>
                      <MaterialCommunityIcons
                        name="chevron-left"
                        size={24}
                        color={Colors.sooprsblue}
                      />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthText}>
                      {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => changeMonth(1)}
                      style={styles.monthNavBtn}>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={Colors.sooprsblue}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekdayRow}>
                    {DAY_LABELS_SHORT.map(day => (
                      <Text key={day} style={styles.weekdayLabel}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  {loadingBlocked ? (
                    <ActivityIndicator
                      size="large"
                      color={Colors.sooprsblue}
                      style={styles.inlineLoader}
                    />
                  ) : (
                    <View style={styles.calendarGrid}>
                      {calendarCells.map(cell => {
                        if (!cell.dateKey) {
                          return <View key={cell.key} style={styles.calendarCellEmpty} />;
                        }

                        const isBlocked = blockedDateSet.has(cell.dateKey);
                        const isBusy = togglingDate === cell.dateKey;
                        const isToday = cell.dateKey === getTodayKey();

                        return (
                          <TouchableOpacity
                            key={cell.key}
                            style={[
                              styles.calendarCell,
                              isToday && styles.calendarCellToday,
                              isBlocked && styles.calendarCellBlocked,
                            ]}
                            onPress={() => handleDatePress(cell.dateKey!)}
                            disabled={isBusy}>
                            {isBusy ? (
                              <ActivityIndicator size="small" color={Colors.sooprsblue} />
                            ) : (
                              <Text
                                style={[
                                  styles.calendarCellText,
                                  isToday && styles.calendarCellTextToday,
                                  isBlocked && styles.calendarCellTextBlocked,
                                ]}>
                                {cell.label}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.calendarLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotToday]} />
                      <Text style={styles.legendText}>Today</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotBlocked]} />
                      <Text style={styles.legendText}>Blocked</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.fieldLabel}>Reason for blocking</Text>
                  <View style={styles.inputWithIcon}>
                    <MaterialCommunityIcons
                      name="text-box-outline"
                      size={18}
                      color={Colors.grey}
                    />
                    <TextInput
                      style={styles.reasonInput}
                      value={blockReason}
                      onChangeText={setBlockReason}
                      placeholder="Holiday, Personal leave..."
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                {blockedDates.length > 0 ? (
                  <View style={styles.blockedList}>
                    <Text style={styles.blockedListTitle}>
                      Blocked this month ({blockedDates.length})
                    </Text>
                    <View style={styles.blockedChips}>
                      {blockedDates.map(item => (
                        <View key={item.date} style={styles.blockedChip}>
                          <MaterialCommunityIcons
                            name="calendar-remove"
                            size={14}
                            color="#D32F2F"
                          />
                          <Text style={styles.blockedChipText}>
                            {item.date}
                            {item.reason ? ` · ${item.reason}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const AvailableSlotsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timezoneLabel, setTimezoneLabel] = useState('IST');
  const [modalVisible, setModalVisible] = useState(false);

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchVendorAvailability();
      setAvailability(result.availability);
      setTimezoneLabel(result.timezoneLabel);
    } catch (error) {
      console.log('loadAvailability error', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load available slots',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAvailability();
    }, [loadAvailability]),
  );

  const sortedSlots = useMemo(
    () => [...availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [availability],
  );

  const activeDaysCount = sortedSlots.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Available Slots</Text>
          <Text style={styles.headerSubtitle}>Manage your weekly availability</Text>
        </View>
        <TouchableOpacity
          style={styles.addButtonPill}
          onPress={() => {
            console.log('[Add Slot] button clicked — opening slot setup modal');
            setModalVisible(true);
          }}
          activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={16} color={Colors.white} />
          <Text style={styles.addButtonPillText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#0077FF', '#0055CC']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.summaryCard, cardShadow]}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIconWrap}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={28}
                  color={Colors.white}
                />
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activeDaysCount}</Text>
                  <Text style={styles.statLabel}>Active Days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{timezoneLabel}</Text>
                  <Text style={styles.statLabel}>Timezone</Text>
                </View>
              </View>
            </View>
            <Text style={styles.summaryNote}>
              Your weekly schedule repeats automatically every week.
            </Text>
          </LinearGradient>

          {sortedSlots.length > 0 ? (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Weekly Schedule</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{activeDaysCount} days</Text>
              </View>
            </View>
          ) : null}

          {sortedSlots.length === 0 ? (
            <View style={[styles.emptyState, cardShadow]}>
              <View style={styles.emptyIconWrap}>
                <Image source={Images.CalenderIcon} style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyTitle}>No slots configured yet</Text>
              <Text style={styles.emptyText}>
                Set your weekly availability so clients can book appointments with you.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.white} />
                <Text style={styles.emptyCtaText}>Set Up Slots</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedSlots.map(slot => (
              <View
                key={`${slot.id ?? slot.dayOfWeek}`}
                style={[styles.slotCard, cardShadow]}>
                <View
                  style={[
                    styles.slotAccent,
                    {backgroundColor: DAY_ACCENTS[slot.dayOfWeek]},
                  ]}
                />
                <View style={styles.slotCardContent}>
                  <View style={styles.slotCardHeader}>
                    <View style={styles.slotDayRow}>
                      <View
                        style={[
                          styles.slotDayBadge,
                          {backgroundColor: `${DAY_ACCENTS[slot.dayOfWeek]}22`},
                        ]}>
                        <Text
                          style={[
                            styles.slotDayBadgeText,
                            {color: DAY_ACCENTS[slot.dayOfWeek]},
                          ]}>
                          {DAY_LABELS_SHORT[slot.dayOfWeek]}
                        </Text>
                      </View>
                      <Text style={styles.slotDay}>{DAY_LABELS[slot.dayOfWeek]}</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                  <View style={styles.slotTimeRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color={Colors.sooprsblue}
                    />
                    <Text style={styles.slotTime}>
                      {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                    </Text>
                  </View>
                  <View style={styles.slotMetaRow}>
                    <View style={styles.slotMetaChip}>
                      <MaterialCommunityIcons
                        name="timer-outline"
                        size={14}
                        color={Colors.grey}
                      />
                      <Text style={styles.slotDuration}>
                        {slot.slotDurationMinutes} min per slot
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <SlotSetupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadAvailability}
      />
    </SafeAreaView>
  );
};

export default AvailableSlotsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: hp(2),
  },
  header: {
    flexDirection: 'row',
    paddingTop: hp(4),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    ...cardShadow,
  },
  backArrowIcon: {
    width: wp(7),
    height: wp(7),
    tintColor: Colors.black,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    marginTop: hp(0.2),
  },
  addButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderRadius: wp(10),
    gap: wp(1),
  },
  addButtonPillText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: FSize.fs13,
    color: Colors.grey,
  },
  summaryCard: {
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: hp(2.5),
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  summaryIconWrap: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(4),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(4),
  },
  summaryStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: FSize.fs11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: hp(0.2),
  },
  statDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: wp(3),
  },
  summaryNote: {
    fontSize: FSize.fs12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: hp(2.2),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  sectionBadge: {
    backgroundColor: Colors.sooprslight,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderRadius: wp(10),
  },
  sectionBadgeText: {
    fontSize: FSize.fs11,
    fontWeight: '600',
    color: Colors.sooprsblue,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    marginBottom: hp(1.5),
    overflow: 'hidden',
  },
  slotAccent: {
    width: wp(1.2),
  },
  slotCardContent: {
    flex: 1,
    padding: wp(4),
  },
  slotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  slotDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  slotDayBadge: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotDayBadgeText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
  },
  slotDay: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightgreen,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(10),
    gap: wp(1.5),
  },
  activeDot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(1),
    backgroundColor: '#4CAF50',
  },
  activeBadgeText: {
    fontSize: FSize.fs11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(0.8),
  },
  slotTime: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: Colors.black,
  },
  slotMetaRow: {
    flexDirection: 'row',
  },
  slotMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
    gap: wp(1.5),
  },
  slotDuration: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(6),
    paddingHorizontal: wp(8),
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    marginTop: hp(1),
  },
  emptyIconWrap: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: Colors.sooprslight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  emptyIcon: {
    width: wp(10),
    height: wp(10),
    tintColor: Colors.sooprsblue,
  },
  emptyTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.8),
  },
  emptyText: {
    fontSize: FSize.fs13,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: hp(2.4),
    marginBottom: hp(2.5),
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.4),
    borderRadius: wp(10),
    gap: wp(2),
  },
  emptyCtaText: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseBtn: {
    width: wp(10),
    height: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
  },
  modalSubtitle: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.2),
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: wp(3),
    backgroundColor: '#E2E8F0',
    padding: wp(1),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.2),
    borderRadius: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    ...cardShadow,
  },
  tabButtonText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
    paddingTop: hp(1),
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.sooprslight,
    borderRadius: wp(3),
    padding: wp(3.5),
    marginBottom: hp(2),
    gap: wp(2.5),
  },
  helperText: {
    flex: 1,
    fontSize: FSize.fs12,
    color: Colors.sooprsDark,
    lineHeight: hp(2.2),
  },
  dayCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...cardShadow,
  },
  dayCardActive: {
    borderColor: '#B3D9FF',
  },
  dayCardInactive: {
    opacity: 0.75,
    backgroundColor: '#FAFBFC',
  },
  dayToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBadge: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  dayBadgeText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: Colors.white,
  },
  dayToggleInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  dayStatusText: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.2),
  },
  dayFields: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: hp(1.5),
    gap: wp(1.5),
  },
  timeFieldGroup: {
    flex: 1,
  },
  timeSeparator: {
    paddingBottom: hp(1.2),
  },
  durationFieldGroup: {
    width: wp(24),
  },
  fieldLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginBottom: hp(0.5),
    fontWeight: '500',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(2.5),
    backgroundColor: '#FAFBFC',
    gap: wp(1.5),
  },
  timeInput: {
    flex: 1,
    paddingVertical: hp(1.1),
    fontSize: FSize.fs13,
    color: Colors.black,
    fontWeight: '500',
  },
  durationSuffix: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: hp(2.5),
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(4),
    paddingVertical: hp(1.7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    ...cardShadow,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '700',
  },
  inlineLoader: {
    marginVertical: hp(3),
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2),
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  monthNavBtn: {
    width: wp(10),
    height: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sooprslight,
    borderRadius: wp(3),
  },
  calendarMonthText: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: FSize.fs11,
    color: Colors.grey,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: wp(2.5),
    marginBottom: hp(0.3),
  },
  calendarCellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: Colors.sooprsblue,
  },
  calendarCellBlocked: {
    backgroundColor: '#FEE2E2',
  },
  calendarCellText: {
    fontSize: FSize.fs13,
    color: Colors.black,
    fontWeight: '500',
  },
  calendarCellTextToday: {
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
  calendarCellTextBlocked: {
    color: '#DC2626',
    fontWeight: '700',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(6),
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  legendDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.5),
  },
  legendDotToday: {
    borderWidth: 2,
    borderColor: Colors.sooprsblue,
    backgroundColor: Colors.white,
  },
  legendDotBlocked: {
    backgroundColor: '#FEE2E2',
  },
  legendText: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    fontWeight: '500',
  },
  reasonBox: {
    marginBottom: hp(2),
  },
  reasonInput: {
    flex: 1,
    paddingVertical: hp(1.2),
    fontSize: FSize.fs13,
    color: Colors.black,
  },
  blockedList: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    ...cardShadow,
  },
  blockedListTitle: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.2),
  },
  blockedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  blockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: wp(10),
    gap: wp(1.5),
  },
  blockedChipText: {
    fontSize: FSize.fs11,
    color: '#B91C1C',
    fontWeight: '500',
  },
  accessDeniedIcon: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: Colors.sooprslight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  accessDeniedTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: FSize.fs13,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
});
