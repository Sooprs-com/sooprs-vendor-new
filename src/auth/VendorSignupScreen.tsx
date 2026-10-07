import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {
  ImagePickerResponse,
  MediaType,
  launchImageLibrary,
} from 'react-native-image-picker';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Images from '../assets/image';
import {persistVendorSession} from '../services/CommonFunction';
import {postData} from '../services/mobile-api';
import {mobile_siteConfig} from '../services/mobile-siteConfig';

type CategoryItem = {
  id: number;
  name: string;
};

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const VendorSignupScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    type?: string;
    fileName?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
    });
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(
        `${mobile_siteConfig.BASE_URL}${mobile_siteConfig.GET_ALL_CATEGORIES}`,
      );
      const result: any = await response.json();
      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];
      setCategories(
        list
          .map((item: any) => ({
            id: Number(item?.id ?? item?.category_id ?? item?.cat_id),
            name: String(item?.name || item?.category_name || ''),
          }))
          .filter((item: CategoryItem) => item.id && item.name),
      );
    } catch (error) {
      showAlert('error', 'Error', 'Unable to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (Platform.Version >= 33) {
      const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      return result === RESULTS.GRANTED;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleImagePicker = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to select images.',
        );
        return;
      }

      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8 as const,
          maxWidth: 1000,
          maxHeight: 1000,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }
          if (response.errorMessage) {
            Alert.alert('Error', response.errorMessage);
            return;
          }
          const asset = response.assets?.[0];
          if (asset?.uri) {
            setSelectedImage({
              uri: asset.uri,
              type: asset.type,
              fileName: asset.fileName,
            });
          }
        },
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      showAlert('error', 'Error', 'Please enter your name.');
      return;
    }
    if (!validateEmail(email)) {
      showAlert('error', 'Error', 'Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      showAlert('error', 'Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password.trim()) {
      showAlert('error', 'Error', 'Please enter a password.');
      return;
    }
    if (!companyName.trim()) {
      showAlert('error', 'Error', 'Please enter company name.');
      return;
    }
    if (!selectedCategory) {
      showAlert('error', 'Error', 'Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('mobile', mobile.trim());
      formData.append('password', password);
      formData.append('category_id', String(selectedCategory.id));
      formData.append('company_name', companyName.trim());

      if (selectedImage?.uri) {
        const imageName =
          selectedImage.fileName ||
          selectedImage.uri.split('/').pop() ||
          'profile_image.jpg';
        formData.append('profile_image', {
          uri:
            Platform.OS === 'ios'
              ? selectedImage.uri.replace('file://', '')
              : selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: imageName,
        } as any);
      }

      const result: any = await postData(
        formData,
        mobile_siteConfig.VENDOR_REGISTER_WITH_PASSWORD,
      );

      const failed =
        result?.success === false ||
        result?.status === 400 ||
        result?.status === 'error';

      const saved = failed
        ? false
        : await persistVendorSession(result, email.trim());

      if (!saved) {
        showAlert(
          'error',
          'Signup failed',
          result?.msg || result?.message || 'Unable to create account.',
        );
        return;
      }

      showAlert(
        'success',
        'Success',
        result?.message || result?.msg || 'Vendor registered successfully',
      );
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'VendorDrawer',
              params: {email: email.trim()},
            },
          ],
        }),
      );
    } catch (error: any) {
      showAlert(
        'error',
        'Error',
        error?.message || 'Something went wrong during signup.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F6FB" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, {paddingTop: insets.top + hp(1.2)}]}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}>
                <Image source={Images.backArrow} style={styles.backIcon} />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>Join as a partner</Text>
                <Text style={styles.headerSubtitle}>
                  Add your business details to start receiving work.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.photoRow}
              activeOpacity={0.8}
              onPress={handleImagePicker}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  {selectedImage?.uri ? (
                    <Image
                      source={{uri: selectedImage.uri}}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={Images.UserRoundIcon}
                      style={styles.avatarPlaceholder}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraBadgeText}>+</Text>
                </View>
              </View>
              <View style={styles.photoCopy}>
                <Text style={styles.photoTitle}>Profile photo</Text>
                <Text style={styles.photoHint}>
                  {selectedImage
                    ? 'Tap to change photo'
                    : 'Tap to upload your profile photo'}
                </Text>
              </View>
            </TouchableOpacity>

            <Field label="Full name" icon={Images.accountIcon}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#9AA6B5"
              />
            </Field>

            <Field label="Email" icon={Images.emailIcon}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="vendor@email.com"
                placeholderTextColor="#9AA6B5"
              />
            </Field>

            <Field label="Mobile" icon={Images.phoneIcon}>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor="#9AA6B5"
              />
            </Field>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Image source={Images.lockIcon} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Create a password"
                placeholderTextColor="#9AA6B5"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                activeOpacity={0.7}>
                <Image
                  source={showPassword ? Images.eyec : Images.eye}
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>

            <Field label="Company name" icon={Images.projectsIcon}>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Your company"
                placeholderTextColor="#9AA6B5"
              />
            </Field>

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              activeOpacity={0.85}
              onPress={() => setCategoryModalVisible(true)}>
              <Image source={Images.categoriesOne} style={styles.fieldIcon} />
              <Text
                style={selectedCategory ? styles.categoryValue : styles.categoryPlaceholder}
                numberOfLines={1}>
                {selectedCategory?.name || 'Select a category'}
              </Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={Colors.sooprsblue} />
              ) : (
                <Image source={Images.downArrowLight} style={styles.chevron} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, {paddingBottom: insets.bottom + hp(2)}]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Choose category</Text>
                <Text style={styles.modalSubtitle}>
                  This helps customers find your services.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setCategoryModalVisible(false)}
                activeOpacity={0.8}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image source={Images.crossIcon} style={styles.modalCloseIcon} />
              </TouchableOpacity>
            </View>
            {loadingCategories ? (
              <ActivityIndicator color={Colors.sooprsblue} style={{marginVertical: hp(3)}} />
            ) : (
              <FlatList
                data={categories}
                keyExtractor={item => String(item.id)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No categories found.</Text>
                }
                renderItem={({item}) => {
                  const selected = selectedCategory?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.categoryItem, selected && styles.categoryItemSelected]}
                      onPress={() => {
                        setSelectedCategory(item);
                        setCategoryModalVisible(false);
                      }}>
                      <Text
                        style={[
                          styles.categoryItemText,
                          selected && styles.categoryItemTextSelected,
                        ]}>
                        {item.name}
                      </Text>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Field = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Image source={icon} style={styles.fieldIcon} />
      {children}
    </View>
  </>
);

export default VendorSignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  header: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    marginLeft: wp(3),
  },
  backButton: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: wp(6.5),
    height: wp(6.5),
    resizeMode: 'contain',
    tintColor: '#102033',
  },
  headerTitle: {
    color: '#102033',
    fontSize: FSize.fs20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7788',
    fontSize: FSize.fs13,
    lineHeight: hp(2.2),
    marginTop: hp(0.4),
  },
  card: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    borderRadius: wp(5),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.4),
    paddingBottom: hp(2.2),
    borderWidth: 1,
    borderColor: '#E8EEF5',
    shadowColor: '#102033',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: wp(4),
    padding: wp(3),
    marginBottom: hp(2.2),
    borderWidth: 1,
    borderColor: '#E3E9F2',
  },
  avatarWrap: {
    width: wp(16),
    height: wp(16),
  },
  avatar: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#E7EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(8),
  },
  avatarPlaceholder: {
    width: wp(8),
    height: wp(8),
    tintColor: '#5B6B80',
  },
  cameraBadge: {
    position: 'absolute',
    right: -wp(0.5),
    bottom: -wp(0.5),
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(2.8),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraBadgeText: {
    color: Colors.white,
    fontSize: FSize.fs12,
    fontWeight: '700',
    marginTop: -1,
  },
  photoCopy: {
    flex: 1,
    marginLeft: wp(3.5),
  },
  photoTitle: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#102033',
  },
  photoHint: {
    fontSize: FSize.fs12,
    color: '#6B7788',
    marginTop: hp(0.3),
  },
  label: {
    fontSize: FSize.fs13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: hp(0.8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E3E9F2',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.2),
    marginBottom: hp(1.8),
    minHeight: hp(6.2),
  },
  fieldIcon: {
    width: wp(4.6),
    height: wp(4.6),
    resizeMode: 'contain',
    tintColor: '#7B8798',
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#102033',
    paddingVertical: hp(1.3),
  },
  eyeIcon: {
    width: wp(5),
    height: wp(5),
    resizeMode: 'contain',
    tintColor: '#607089',
    marginLeft: wp(2),
  },
  categoryValue: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#102033',
  },
  categoryPlaceholder: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#9AA6B5',
  },
  chevron: {
    width: wp(3.5),
    height: wp(3.5),
    resizeMode: 'contain',
    tintColor: '#607089',
  },
  primaryButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(3),
    minHeight: hp(6.4),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.6),
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  footerText: {
    fontSize: FSize.fs13,
    color: '#6B7788',
  },
  footerLink: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    fontWeight: '700',
    marginLeft: wp(1.5),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '72%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
  },
  modalHandle: {
    alignSelf: 'center',
    width: wp(12),
    height: hp(0.5),
    borderRadius: hp(0.3),
    backgroundColor: '#D5DDE8',
    marginBottom: hp(1.4),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.2),
  },
  modalHeaderCopy: {
    flex: 1,
    paddingRight: wp(3),
  },
  modalTitle: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: '#102033',
  },
  modalSubtitle: {
    fontSize: FSize.fs13,
    color: '#6B7788',
    marginTop: hp(0.4),
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    marginBottom: hp(0.6),
    backgroundColor: '#F7F9FC',
  },
  categoryItemSelected: {
    backgroundColor: '#E8F2FF',
  },
  categoryItemText: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#102033',
  },
  categoryItemTextSelected: {
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
  radio: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 1.5,
    borderColor: '#C5D0DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.sooprsblue,
  },
  radioDot: {
    width: wp(2.4),
    height: wp(2.4),
    borderRadius: wp(1.2),
    backgroundColor: Colors.sooprsblue,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7788',
    marginVertical: hp(3),
  },
  modalClose: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    width: wp(3.8),
    height: wp(3.8),
    resizeMode: 'contain',
    tintColor: '#334155',
  },
});
