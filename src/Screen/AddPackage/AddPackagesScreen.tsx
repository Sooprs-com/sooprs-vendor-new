import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Switch,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import { postDataWithToken, getDataWithToken, putDataWithTokenFormData } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import {canEnablePackageAppointment} from '../../services/vendorAvailabilityApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddPackagesScreen = ({route}: any) => {
  const navigation = useNavigation();
  const isEditMode = route?.params?.isEditMode || false;
  const editPackageData = route?.params?.packageData || null;

  const [packageName, setPackageName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');

  // Inclusions
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [inclusionsTags, setInclusionsTags] = useState<string[]>([]);
  const inclusionsOptions = [
    'Daily Yoga & Meditation Sessions',
    'Ayurvedic Spa & Massage Treatments',
    'Detox Diet - Breakfast, Lunch & Dinner',
  ];

  // Exclusions
  const [exclusionsInput, setExclusionsInput] = useState('');
  const [exclusionsTags, setExclusionsTags] = useState<string[]>([]);
  const exclusionsOptions = [
    'Photography & Videography',
    'Private Ayurveda Doctor Consultation',
  ];

  // Amenities
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [amenitiesTags, setAmenitiesTags] = useState<string[]>([]);
  const amenitiesOptions = [
    'Herbal Tea Lounge',
    '24x7 Wellness Support',
    'In-house Ayurveda Center',
  ];

  // Policy
  const [policyInput, setPolicyInput] = useState('');
  const [policyTags, setPolicyTags] = useState<string[]>([]);
  const policyOptions = [
    'Refund',
    'No Refund',
    'Cancellation',
  ];

  // Location and Pricing
  const [location1, setLocation1] = useState('');
  const [location2, setLocation2] = useState('');
  const [basePrice, setBasePrice] = useState('');

  const [discountPrice, setDiscountPrice] = useState('');
  const [chargesPerDay, setChargesPerDay] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [requiresAppointment, setRequiresAppointment] = useState(false);
  const [showAppointmentField, setShowAppointmentField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Images - Thumbnail (1 image) and Default (max 4 images)
  const [thumbnailImage, setThumbnailImage] = useState<string>('');
  const [defaultImages, setDefaultImages] = useState<string[]>([]);

  // Fetch vendor profile to get category_id and vendor_id
  const getVendorProfile = async () => {
    try {
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data = await res.json();
      
      if (data?.success && data?.vendorDetail) {
        const appointmentEnabled = canEnablePackageAppointment(data);
        setShowAppointmentField(appointmentEnabled);
        if (!appointmentEnabled) {
          setRequiresAppointment(false);
        }

        // Set category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        } else {
        }
        
        // Store vendor_id if not already stored
        const storedVendorId = await AsyncStorage.getItem(mobile_siteConfig.UID);
        if (!storedVendorId && data.vendorDetail.id) {
          await AsyncStorage.setItem(mobile_siteConfig.UID, String(data.vendorDetail.id));
        }
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    getVendorProfile();
    
    // Auto-fill form if in edit mode
    if (isEditMode && editPackageData) {
      
      setPackageName(editPackageData.name || '');
      setShortDescription(editPackageData.short_description || '');
      setLongDescription(editPackageData.long_description || '');
      setLocation1(editPackageData.location1 || '');
      setLocation2(editPackageData.location2 || '');
      
      // Convert base_price to string (might be number)
      const basePriceValue = editPackageData.base_price;
      setBasePrice(basePriceValue !== null && basePriceValue !== undefined ? String(basePriceValue) : '');
      
      // Convert discount_price to string (might be number)
      const discountPriceValue = editPackageData.discount_price;
      setDiscountPrice(discountPriceValue !== null && discountPriceValue !== undefined ? String(discountPriceValue) : '');
      
      // Set charges per day (check multiple possible field names)
      const chargesPerDayValue = editPackageData.charges_per_day || editPackageData.chargesPerDay || editPackageData.per_day_charges || editPackageData.charges || '';
      setChargesPerDay(chargesPerDayValue !== null && chargesPerDayValue !== undefined ? String(chargesPerDayValue) : '');
      
      // Set tags from arrays
      if (editPackageData.included && Array.isArray(editPackageData.included)) {
        setInclusionsTags(editPackageData.included);
      }
      if (editPackageData.not_included && Array.isArray(editPackageData.not_included)) {
        setExclusionsTags(editPackageData.not_included);
      }
      if (editPackageData.amenities && Array.isArray(editPackageData.amenities)) {
        setAmenitiesTags(editPackageData.amenities);
      }
      if (editPackageData.policy) {
        // Handle policy - could be array or object
        if (Array.isArray(editPackageData.policy)) {
          setPolicyTags(editPackageData.policy);
        } else if (typeof editPackageData.policy === 'object') {
          // Convert object to array of strings
          const policyArray = Object.entries(editPackageData.policy).map(([key, value]) => 
            `${key}: ${value}`
          );
          setPolicyTags(policyArray);
        } else if (typeof editPackageData.policy === 'string') {
          try {
            const parsed = JSON.parse(editPackageData.policy);
            if (Array.isArray(parsed)) {
              setPolicyTags(parsed);
            } else if (typeof parsed === 'object') {
              const policyArray = Object.entries(parsed).map(([key, value]) => 
                `${key}: ${value}`
              );
              setPolicyTags(policyArray);
            }
          } catch {
            setPolicyTags([editPackageData.policy]);
          }
        }
      }
      
      // Set category ID
      if (editPackageData.category_id) {
        setCategoryId(String(editPackageData.category_id));
      }

      const requiresAppointmentValue =
        editPackageData.requires_appointment ??
        editPackageData.requiresAppointment;
      if (
        requiresAppointmentValue === 1 ||
        requiresAppointmentValue === '1' ||
        requiresAppointmentValue === true
      ) {
        setRequiresAppointment(true);
      } else if (
        requiresAppointmentValue === 0 ||
        requiresAppointmentValue === '0' ||
        requiresAppointmentValue === false
      ) {
        setRequiresAppointment(false);
      }
      
      // Set images - convert URLs to local URIs if needed
      if (editPackageData.thumbnail_image) {
        const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
        setThumbnailImage(baseUrl + editPackageData.thumbnail_image);
      }
      if (editPackageData.other_images && Array.isArray(editPackageData.other_images)) {
        const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
        const imageUris = editPackageData.other_images.map((img: string) => baseUrl + img);
        setDefaultImages(imageUris);
      }
    }
  }, [isEditMode, editPackageData]);

  const addTag = (
    tags: string[],
    setTags: (tags: string[]) => void,
    input: string,
    setInput: (input: string) => void,
  ) => {
    if (input.trim()) {
      setTags([...tags, input.trim()]);
      setInput('');
    }
  };

  const removeTag = (
    tags: string[],
    setTags: (tags: string[]) => void,
    index: number,
  ) => {
    setTags(tags.filter((_: string, i: number) => i !== index));
  };

  const addOption = (
    tags: string[],
    setTags: (tags: string[]) => void,
    option: string,
  ) => {
    if (!tags.includes(option)) {
      setTags([...tags, option]);
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        // Android 13+ (API 33+)
        const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        return result === RESULTS.GRANTED;
      } else {
        // Android 12 and below
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS permissions are handled automatically
  };

  const pickThumbnailImage = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to select images.',
        );
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        maxWidth: 2000,
        maxHeight: 2000,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            setThumbnailImage(imageUri);
          }
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const pickDefaultImage = async () => {
    try {
      const remainingSlots = 4 - defaultImages.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', 'You can upload maximum 4 default images.');
        return;
      }

      const hasPermission = await requestStoragePermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to select images.',
        );
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        maxWidth: 2000,
        maxHeight: 2000,
        selectionLimit: remainingSlots, // Allow selecting multiple images up to remaining slots
        includeBase64: false,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          // Get all selected image URIs
          const selectedImages = response.assets
            .map(asset => asset.uri)
            .filter((uri): uri is string => uri !== undefined);
          
          // Strictly enforce the limit - only add images up to remaining slots
          const imagesToAdd = selectedImages.slice(0, remainingSlots);
          
          if (imagesToAdd.length > 0) {
            setDefaultImages([...defaultImages, ...imagesToAdd]);
            
            // Show alert if user selected more than allowed
            if (selectedImages.length > remainingSlots) {
              Alert.alert(
                'Limit Reached', 
                `Only ${remainingSlots} image(s) added. Maximum limit is 4 images.`
              );
            }
          }
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };
  
  const createPackage = async () => {
    try {
      // Validation
      if (!packageName.trim()) {
        Alert.alert('Error', 'Please enter package name');
        return;
      }
      if (!shortDescription.trim()) {
        Alert.alert('Error', 'Please enter short description');
        return;
      }
      if (!longDescription.trim()) {
        Alert.alert('Error', 'Please enter long description');
        return;
      }
      if (!basePrice.trim()) {
        Alert.alert('Error', 'Please enter base price');
        return;
      }
      if (!categoryId) {
        Alert.alert('Error', 'Category ID not found. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check if thumbnail image is uploaded
      if (!thumbnailImage) {
        Alert.alert('Error', 'Please upload thumbnail image');
        return;
      }

      setIsSubmitting(true);

      // Get vendor_id from AsyncStorage or from editPackageData
      let vendorId = await AsyncStorage.getItem(mobile_siteConfig.UID);
      
      // Fallback: get vendor_id from edit package data if available
      if (!vendorId && isEditMode && editPackageData?.vendor_id) {
        vendorId = String(editPackageData.vendor_id);
      }
      
      // If still not found, try to get from vendor profile
      if (!vendorId) {
        try {
          const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
          const data = await res.json();
          if (data?.success && data?.vendorDetail?.id) {
            vendorId = String(data.vendorDetail.id);
            await AsyncStorage.setItem(mobile_siteConfig.UID, vendorId);
          }
        } catch (error) {
        }
      }
      
      if (!vendorId) {
        Alert.alert('Error', 'Vendor ID not found. Please login again.');
        setIsSubmitting(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      
      // Add package_id if in edit mode (required for update)
      if (isEditMode) {
        // Try multiple possible field names for package ID
        const packageId = editPackageData?.id || 
                         editPackageData?.package_id || 
                         editPackageData?.packageId ||
                         editPackageData?.package?.id ||
                         editPackageData?.package?.package_id;
        
        
        if (!packageId) {
          Alert.alert('Error', 'Package ID not found. Cannot update package. Please check console logs.');
          setIsSubmitting(false);
          return;
        }
        
        // Append package_id as string (API expects string format based on curl example)
        formData.append('package_id', String(packageId));
      } else {
      }
      
      // Add text fields
      formData.append('name', packageName.trim());
      formData.append('short_description', shortDescription.trim());
      formData.append('long_description', longDescription.trim());
      formData.append('category_id', categoryId);
      formData.append('vendor_id', vendorId);
      formData.append('base_price', basePrice.trim());
      formData.append('discount_price', discountPrice.trim() || '0');
      formData.append('location1', location1.trim() || '');
      formData.append('location2', location2.trim() || '');
      formData.append('status', '1');
      formData.append(
        'requires_appointment',
        showAppointmentField && requiresAppointment ? '1' : '0',
      );

      // Add inclusions as JSON array string
      formData.append('included', JSON.stringify(inclusionsTags));

      // Add exclusions as JSON array string
      formData.append('not_included', JSON.stringify(exclusionsTags));

      // Add amenities as JSON array string
      formData.append('amenities', JSON.stringify(amenitiesTags));

      // Add policy as JSON array string
      formData.append('policy', JSON.stringify(policyTags));
      
      // Add thumbnail image (only if it's a local file, not a URL)
      if (thumbnailImage && !thumbnailImage.startsWith('http')) {
        const thumbnailFileName = thumbnailImage.split('/').pop() || 'thumbnail.jpg';
        const thumbnailFileType = thumbnailFileName.split('.').pop() || 'jpg';
        formData.append('thumbnail_image', {
          uri: Platform.OS === 'android' ? thumbnailImage : thumbnailImage.replace('file://', ''),
          type: `image/${thumbnailFileType}`,
          name: thumbnailFileName,
        } as any);
      }

      // Add default images (max 4) - only local files, not URLs
      defaultImages.forEach((imageUri, index) => {
        if (!imageUri.startsWith('http')) {
          const fileName = imageUri.split('/').pop() || `image_${index}.jpg`;
          const fileType = fileName.split('.').pop() || 'jpg';
          formData.append('other_images', {
            uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
            type: `image/${fileType}`,
            name: fileName,
          } as any);
        }
      });

      // Verify package_id is included in edit mode
      if (isEditMode) {
        const packageId = editPackageData?.id || 
                         editPackageData?.package_id || 
                         editPackageData?.packageId ||
                         editPackageData?.package?.id ||
                         editPackageData?.package?.package_id;
        if (!packageId) {
          Alert.alert('Error', 'Package ID is missing. Cannot proceed with update.');
          setIsSubmitting(false);
          return;
        }
      }
      
      
      // Call create or update package API
      const apiEndpoint = isEditMode ? mobile_siteConfig.UPDATE_PACKAGE : mobile_siteConfig.CREATE_PACKAGE;
      const apiFunction = isEditMode ? putDataWithTokenFormData : postDataWithToken;
      
      
      const result: any = await apiFunction(formData, apiEndpoint);

      // Check for error responses
      if (result?.status === 400 || result?.status === 'error' || (result?.success === false)) {
        Alert.alert('Error', result?.msg || result?.message || 'Failed to create package');
        setIsSubmitting(false);
        return;
      }

      // Check if package creation/update was successful
      if (result?.success === true || result?.status === 'success') {
        const successMessage = isEditMode 
          ? (result?.message || result?.msg || 'Package updated successfully')
          : (result?.message || result?.msg || 'Package created successfully');
        Alert.alert('Success', successMessage, [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        const errorMessage = isEditMode 
          ? (result?.msg || result?.message || 'Failed to update package')
          : (result?.msg || result?.message || 'Failed to create package');
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred while creating package');
    } finally {
      setIsSubmitting(false);
    }
  };
  const removeThumbnailImage = () => {
    setThumbnailImage('');
  };

  const removeDefaultImage = (index: number) => {
    const newImages = defaultImages.filter((_, i) => i !== index);
    setDefaultImages(newImages);
  };

  const tagPlaceholder = (label: string) => {
    if (label === 'Inclusions') return 'e.g. Healing workshops';
    if (label === 'Exclusions') return 'e.g. Airfare';
    if (label === 'Policy') return 'e.g. Refund policy';
    return 'e.g. Spa & Sauna';
  };

  const renderTagSection = (
    label: string,
    input: string,
    setInput: (input: string) => void,
    tags: string[],
    setTags: (tags: string[]) => void,
    options: string[] | null,
  ) => (
    <View style={styles.tagSection}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.tagInputRow,
          focusedField === label && styles.inputFocused,
        ]}>
        <TextInput
          style={styles.tagInput}
          placeholder={tagPlaceholder(label)}
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocusedField(label)}
          onBlur={() => setFocusedField(null)}
          onSubmitEditing={() => addTag(tags, setTags, input, setInput)}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.tagAddBtn}
          activeOpacity={0.85}
          onPress={() => addTag(tags, setTags, input, setInput)}>
          <Text style={styles.tagAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsWrap}>
          {tags.map((tag: string, index: number) => (
            <View key={`${tag}-${index}`} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tags, setTags, index)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                style={styles.tagRemove}>
                <Text style={styles.tagRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {options && options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.suggestLabel}>Suggestions</Text>
          <View style={styles.optionsWrap}>
            {options.map((option: string, index: number) => {
              const added = tags.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.addOptionButton, added && styles.addOptionButtonAdded]}
                  activeOpacity={0.8}
                  onPress={() => addOption(tags, setTags, option)}>
                  <Text style={[styles.addOptionText, added && styles.addOptionTextAdded]}>
                    {added ? 'Added' : `+ ${option}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderField = (
    fieldKey: string,
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    extra?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'numeric';
      required?: boolean;
    },
  ) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>
        {label}
        {extra?.required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          extra?.multiline && styles.textArea,
          focusedField === fieldKey && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={extra?.multiline}
        numberOfLines={extra?.multiline ? 4 : 1}
        keyboardType={extra?.keyboardType || 'default'}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        textAlignVertical={extra?.multiline ? 'top' : 'center'}
      />
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Package' : 'Add Package'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode
              ? 'Update details customers will see'
              : 'Create a package customers can book'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(1) : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#EEF4FF'}]}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={wp(5.4)}
                  color={Colors.sooprsblue}
                />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Package Details</Text>
                <Text style={styles.sectionSubtitle}>
                  Name and description shown on the listing
                </Text>
              </View>
            </View>
            {renderField(
              'name',
              'Package Name',
              packageName,
              setPackageName,
              'Enter package name',
              {required: true},
            )}
            {renderField(
              'short',
              'Short Description',
              shortDescription,
              setShortDescription,
              'A short line customers see first',
              {multiline: true, required: true},
            )}
            {renderField(
              'long',
              'Long Description',
              longDescription,
              setLongDescription,
              'Describe what is included in this package',
              {multiline: true, required: true},
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#ECFDF5'}]}>
                <MaterialCommunityIcons
                  name="format-list-checks"
                  size={wp(5.4)}
                  color="#059669"
                />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>What’s Included</Text>
                <Text style={styles.sectionSubtitle}>
                  Policy, inclusions, exclusions and amenities
                </Text>
              </View>
            </View>
            {renderTagSection(
              'Policy',
              policyInput,
              setPolicyInput,
              policyTags,
              setPolicyTags,
              policyOptions,
            )}
            {renderTagSection(
              'Inclusions',
              inclusionsInput,
              setInclusionsInput,
              inclusionsTags,
              setInclusionsTags,
              inclusionsOptions,
            )}
            {renderTagSection(
              'Exclusions',
              exclusionsInput,
              setExclusionsInput,
              exclusionsTags,
              setExclusionsTags,
              exclusionsOptions,
            )}
            {renderTagSection(
              'Amenities',
              amenitiesInput,
              setAmenitiesInput,
              amenitiesTags,
              setAmenitiesTags,
              amenitiesOptions,
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#FFF7ED'}]}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={wp(5.4)}
                  color="#EA580C"
                />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Pricing & Location</Text>
                <Text style={styles.sectionSubtitle}>
                  Where the package is offered and what it costs
                </Text>
              </View>
            </View>
            {renderField(
              'location1',
              'Location 1',
              location1,
              setLocation1,
              'e.g. Rishikesh',
            )}
            {renderField(
              'location2',
              'Location 2',
              location2,
              setLocation2,
              'Optional second location',
            )}
            <View style={styles.priceRow}>
              <View style={styles.priceCol}>
                {renderField(
                  'basePrice',
                  'Base Price',
                  basePrice,
                  setBasePrice,
                  '0',
                  {keyboardType: 'numeric', required: true},
                )}
              </View>
              <View style={styles.priceCol}>
                {renderField(
                  'discountPrice',
                  'Discount Price',
                  discountPrice,
                  setDiscountPrice,
                  '0',
                  {keyboardType: 'numeric'},
                )}
              </View>
            </View>
          </View>

          {showAppointmentField && (
            <View style={styles.sectionCard}>
              <View style={styles.toggleRow}>
                <View style={[styles.sectionIcon, {backgroundColor: '#EEF4FF'}]}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={wp(5.4)}
                    color={Colors.sooprsblue}
                  />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Appointment Available</Text>
                  <Text style={styles.toggleSubLabel}>
                    {requiresAppointment
                      ? 'Customers can book a time slot for this package'
                      : 'Turn on if customers should book a time slot'}
                  </Text>
                </View>
                <Switch
                  value={requiresAppointment}
                  onValueChange={setRequiresAppointment}
                  trackColor={{false: '#E2E8F0', true: '#93C5FD'}}
                  thumbColor={requiresAppointment ? Colors.sooprsblue : '#F8FAFC'}
                />
              </View>
            </View>
          )}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#F5F3FF'}]}>
                <MaterialCommunityIcons
                  name="image-multiple-outline"
                  size={wp(5.4)}
                  color="#7C3AED"
                />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  Photos<Text style={styles.required}> *</Text>
                </Text>
                <Text style={styles.sectionSubtitle}>
                  One cover image and up to 4 gallery photos
                </Text>
              </View>
            </View>

            <View style={styles.photoRow}>
              <View style={styles.coverColumn}>
                <Text style={styles.photoLabel}>Cover photo</Text>
                {thumbnailImage ? (
                  <View style={styles.photoTile}>
                    <Image source={{uri: thumbnailImage}} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoChange}
                      activeOpacity={0.85}
                      onPress={pickThumbnailImage}>
                      <Text style={styles.photoChangeText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={removeThumbnailImage}
                      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                      <Text style={styles.photoRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.photoTile, styles.photoAdd]}
                    activeOpacity={0.85}
                    onPress={pickThumbnailImage}>
                    <MaterialCommunityIcons
                      name="camera-plus-outline"
                      size={wp(5.2)}
                      color={Colors.sooprsblue}
                    />
                    <Text style={styles.photoAddText}>Add cover</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.galleryColumn}>
                <Text style={styles.photoLabel}>
                  Gallery · {defaultImages.length}/4
                </Text>
                <View style={styles.photoGrid}>
                  {defaultImages.map((imageUri, index) => (
                    <View key={`${imageUri}-${index}`} style={styles.photoTile}>
                      <Image source={{uri: imageUri}} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => removeDefaultImage(index)}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <Text style={styles.photoRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {defaultImages.length < 4 && (
                    <TouchableOpacity
                      style={[styles.photoTile, styles.photoAdd]}
                      activeOpacity={0.85}
                      onPress={pickDefaultImage}>
                      <MaterialCommunityIcons
                        name="plus"
                        size={wp(5.2)}
                        color={Colors.sooprsblue}
                      />
                      <Text style={styles.photoAddText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={createPackage}
            disabled={isSubmitting}
            activeOpacity={0.85}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <MaterialCommunityIcons
                name={isEditMode ? 'content-save-outline' : 'plus-circle-outline'}
                size={wp(5.4)}
                color={Colors.white}
              />
            )}
            <Text style={styles.submitText}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating package...'
                  : 'Creating package...'
                : isEditMode
                  ? 'Update Package'
                  : 'Add Package'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddPackagesScreen;

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  android: {
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    paddingTop:
      Platform.OS === 'ios'
        ? hp(6.5)
        : (StatusBar.currentHeight || hp(3)) + hp(1.2),
    paddingBottom: hp(1.5),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF5',
  },
  backButton: {
    padding: wp(2),
  },
  backIcon: {
    width: wp(7.2),
    height: wp(7.2),
    tintColor: '#0F172A',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FSize.fs22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: hp(0.25),
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: wp(11),
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(2),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.2),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.7),
    paddingBottom: hp(1.6),
    marginBottom: hp(1.6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...cardShadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.6),
    paddingBottom: hp(1.3),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    marginTop: hp(0.25),
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: hp(2.2),
  },
  fieldWrap: {
    marginBottom: hp(1.5),
  },
  label: {
    fontSize: FSize.fs17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: hp(0.7),
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.6),
    paddingVertical: Platform.OS === 'ios' ? hp(1.5) : hp(1.2),
    minHeight: hp(6.4),
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '700',
  },
  inputFocused: {
    borderColor: Colors.sooprsblue,
    backgroundColor: '#F8FBFF',
  },
  textArea: {
    minHeight: hp(13),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },
  priceRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  priceCol: {
    flex: 1,
  },
  tagSection: {
    marginBottom: hp(1.8),
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: wp(3),
    paddingLeft: wp(3.4),
    paddingRight: wp(1.2),
    minHeight: hp(6.4),
  },
  tagInput: {
    flex: 1,
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '700',
    paddingVertical: hp(1.2),
  },
  tagAddBtn: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2.4),
    paddingHorizontal: wp(3.6),
    paddingVertical: hp(1),
  },
  tagAddBtnText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '800',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1),
    gap: wp(2),
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: wp(5),
    paddingVertical: hp(0.7),
    paddingLeft: wp(3.2),
    paddingRight: wp(1.6),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tagChipText: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: wp(1.4),
  },
  tagRemove: {
    width: wp(5.2),
    height: wp(5.2),
    borderRadius: wp(2.6),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
    lineHeight: FSize.fs18,
  },
  optionsContainer: {
    marginTop: hp(1.1),
  },
  suggestLabel: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: hp(0.7),
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  addOptionButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: wp(5),
    paddingVertical: hp(0.85),
    paddingHorizontal: wp(3.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addOptionButtonAdded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  addOptionText: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#334155',
  },
  addOptionTextAdded: {
    color: '#047857',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: wp(2),
  },
  toggleLabel: {
    fontSize: FSize.fs17,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleSubLabel: {
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: hp(0.35),
    lineHeight: hp(2.3),
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
  },
  coverColumn: {
    width: wp(28),
  },
  galleryColumn: {
    flex: 1,
  },
  photoLabel: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: hp(0.7),
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  photoTile: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(2.6),
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoAdd: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: {
    marginTop: hp(0.3),
    fontSize: FSize.fs12,
    fontWeight: '800',
    color: Colors.sooprsblue,
    textAlign: 'center',
  },
  photoChange: {
    position: 'absolute',
    left: wp(1.2),
    bottom: wp(1.2),
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: wp(1.6),
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.3),
  },
  photoChangeText: {
    color: Colors.white,
    fontSize: FSize.fs11,
    fontWeight: '800',
  },
  photoRemove: {
    position: 'absolute',
    top: wp(1),
    right: wp(1),
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: Colors.white,
    fontSize: FSize.fs14,
    fontWeight: '700',
    lineHeight: FSize.fs16,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(2.8) : hp(1.8),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E8EEF5',
  },
  submitBtn: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(1.85),
    borderRadius: wp(3.2),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(2),
    ...Platform.select({
      ios: {
        shadowColor: Colors.sooprsblue,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    ...Platform.select({
      ios: {shadowOpacity: 0},
      android: {elevation: 0},
    }),
  },
  submitText: {
    color: Colors.white,
    fontSize: FSize.fs17,
    fontWeight: '800',
  },
});
