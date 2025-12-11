import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import { postDataWithToken, getDataWithToken, putDataWithTokenFormData } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Images - Thumbnail (1 image) and Default (max 4 images)
  const [thumbnailImage, setThumbnailImage] = useState<string>('');
  const [defaultImages, setDefaultImages] = useState<string[]>([]);

  // Fetch vendor profile to get category_id and vendor_id
  const getVendorProfile = async () => {
    try {
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data = await res.json();
      console.log('Vendor profile data:::::', data);
      
      if (data?.success && data?.vendorDetail) {
        // Set category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
          console.log('Category ID set from vendor profile:', data.vendorDetail.category_id);
        } else {
          console.log('Category ID not found in vendor profile');
        }
        
        // Store vendor_id if not already stored
        const storedVendorId = await AsyncStorage.getItem(mobile_siteConfig.UID);
        if (!storedVendorId && data.vendorDetail.id) {
          await AsyncStorage.setItem(mobile_siteConfig.UID, String(data.vendorDetail.id));
          console.log('Vendor ID stored from vendor profile:', data.vendorDetail.id);
        }
      }
    } catch (error) {
      console.log('error fetching vendor profile:::::', error);
    }
  };

  useEffect(() => {
    getVendorProfile();
    
    // Auto-fill form if in edit mode
    if (isEditMode && editPackageData) {
      console.log('Edit Package Data for auto-fill:', JSON.stringify(editPackageData, null, 2));
      console.log('Package ID in editPackageData:', editPackageData.id || editPackageData.package_id || editPackageData.packageId);
      
      setPackageName(editPackageData.name || '');
      setShortDescription(editPackageData.short_description || '');
      setLongDescription(editPackageData.long_description || '');
      setLocation1(editPackageData.location1 || '');
      setLocation2(editPackageData.location2 || '');
      
      // Convert base_price to string (might be number)
      const basePriceValue = editPackageData.base_price;
      setBasePrice(basePriceValue !== null && basePriceValue !== undefined ? String(basePriceValue) : '');
      console.log('Base Price set to:', basePriceValue !== null && basePriceValue !== undefined ? String(basePriceValue) : '');
      
      // Convert discount_price to string (might be number)
      const discountPriceValue = editPackageData.discount_price;
      setDiscountPrice(discountPriceValue !== null && discountPriceValue !== undefined ? String(discountPriceValue) : '');
      console.log('Discount Price set to:', discountPriceValue !== null && discountPriceValue !== undefined ? String(discountPriceValue) : '');
      
      // Set charges per day (check multiple possible field names)
      const chargesPerDayValue = editPackageData.charges_per_day || editPackageData.chargesPerDay || editPackageData.per_day_charges || editPackageData.charges || '';
      setChargesPerDay(chargesPerDayValue !== null && chargesPerDayValue !== undefined ? String(chargesPerDayValue) : '');
      console.log('Charges Per Day set to:', chargesPerDayValue !== null && chargesPerDayValue !== undefined ? String(chargesPerDayValue) : '');
      
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
      console.log('ImagePicker Exception: ', error);
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
      console.log('ImagePicker Exception: ', error);
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
      if (!location1.trim()) {
        Alert.alert('Error', 'Please enter location 1');
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
          console.log('Error fetching vendor profile for vendor_id:', error);
        }
      }
      
      console.log('vendorId:::::', vendorId);
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
        
        console.log('Edit mode - Package ID check:');
        console.log('- editPackageData?.id:', editPackageData?.id);
        console.log('- editPackageData?.package_id:', editPackageData?.package_id);
        console.log('- editPackageData?.packageId:', editPackageData?.packageId);
        console.log('- editPackageData?.package?.id:', editPackageData?.package?.id);
        console.log('- Final packageId:', packageId);
        console.log('- Full editPackageData:', JSON.stringify(editPackageData, null, 2));
        
        if (!packageId) {
          Alert.alert('Error', 'Package ID not found. Cannot update package. Please check console logs.');
          setIsSubmitting(false);
          return;
        }
        
        // Append package_id as string (API expects string format based on curl example)
        formData.append('package_id', String(packageId));
        console.log('✓ Package ID appended to FormData:', String(packageId));
      } else {
        console.log('Create mode - No package_id needed');
      }

      // Add text fields
      formData.append('name', packageName.trim());
      formData.append('short_description', shortDescription.trim());
      formData.append('long_description', longDescription.trim());
      formData.append('category_id', categoryId);
      formData.append('vendor_id', vendorId);
      formData.append('base_price', basePrice.trim());
      formData.append('discount_price', discountPrice.trim() || '0');
      formData.append('location1', location1.trim());
      formData.append('location2', location2.trim() || '');
      formData.append('status', '1');

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
        console.log('Final verification - Package ID being sent:', packageId);
        if (!packageId) {
          Alert.alert('Error', 'Package ID is missing. Cannot proceed with update.');
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('Package FormData prepared. isEditMode:', isEditMode);
      
      // Call create or update package API
      const apiEndpoint = isEditMode ? mobile_siteConfig.UPDATE_PACKAGE : mobile_siteConfig.CREATE_PACKAGE;
      const apiFunction = isEditMode ? putDataWithTokenFormData : postDataWithToken;
      
      console.log('API Endpoint:', apiEndpoint);
      console.log('API Function:', isEditMode ? 'PUT' : 'POST');
      
      const result: any = await apiFunction(formData, apiEndpoint);
      console.log(isEditMode ? 'Update package result:::::' : 'Create package result:::::', result);

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
      console.log('Create package error:::::', error);
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

  const renderTagSection = (
    label: string,
    input: string,
    setInput: (input: string) => void,
    tags: string[],
    setTags: (tags: string[]) => void,
    options: string[] | null,
    tagColor: string = Colors.sooprslight,
    tagTextColor: string = Colors.black,
    removeIconColor: string = Colors.sooprsblue,
  ) => (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputWithTagsContainer}>
          <TextInput
            style={styles.inputWithTags}
            placeholder={`e.g ${label === 'INCLUSIONS' ? 'Healing workshops' : label === 'EXCLUSIONS' ? 'Airfare' : label === 'POLICY' ? 'Refund policy' : 'Spa & Sauna'}`}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => addTag(tags, setTags, input, setInput)}
            multiline={false}
          />
          {/* Tags inside input box */}
          {tags.length > 0 && (
            <View style={styles.tagsInsideInput}>
              {tags.map((tag: string, index: number) => (
                <View
                  key={index}
                  style={[styles.tagInsideInput, {backgroundColor: tagColor}]}>
                  <Text style={[styles.tagTextInsideInput, {color: tagTextColor}]}>
                    {tag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tags, setTags, index)}
                    style={[
                      styles.tagRemoveInsideInput,
                      {backgroundColor: removeIconColor},
                    ]}>
                    <Text
                      style={[
                        styles.tagRemoveTextInsideInput,
                        {
                          color:
                            tagColor === Colors.sooprslight
                              ? Colors.white
                              : Colors.grey,
                        },
                      ]}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Add Options */}
      {options && options.length > 0 && (
        <View style={styles.optionsContainer}>
          {options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.addOptionButton,
                {backgroundColor: tagColor === Colors.sooprslight ? Colors.sooprslight : Colors.lightgrey1},
              ]}
              onPress={() => addOption(tags, setTags, option)}>
              <Text
                style={[
                  styles.addOptionText,
                  {color: tagTextColor},
                ]}>
                + {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Images.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Package' : 'Add Packages'}</Text>
        </View>

        <View style={styles.divider} />

        {/* PACKAGE NAME */}
        <Text style={styles.label}>PACKAGE NAME</Text>
        <TextInput
          style={styles.input}
          value={packageName}
          onChangeText={setPackageName}
          placeholder="Enter package name"
          placeholderTextColor={Colors.grey}
        />

        {/* SHORT DESCRIPTION */}
        <Text style={styles.label}>SHORT DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="Enter short description"
          placeholderTextColor={Colors.grey}
          multiline
          numberOfLines={4}
        />

        {/* LONG DESCRIPTION */}
        <Text style={styles.label}>LONG DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={longDescription}
          onChangeText={setLongDescription}
          placeholder="Enter long description"
          placeholderTextColor={Colors.grey}
          multiline
          numberOfLines={6}
        />

        {/* POLICY */}
        {renderTagSection(
          'POLICY',
          policyInput,
          setPolicyInput,
          policyTags,
          setPolicyTags,
          policyOptions,
          Colors.sooprslight,
          Colors.black,
          Colors.sooprsblue,
        )}

        {/* INCLUSIONS */}
        {renderTagSection(
          'INCLUSIONS',
          inclusionsInput,
          setInclusionsInput,
          inclusionsTags,
          setInclusionsTags,
          inclusionsOptions,
          Colors.sooprslight,
          Colors.black,
          Colors.sooprsblue,
        )}

        {/* EXCLUSIONS */}
        {renderTagSection(
          'EXCLUSIONS',
          exclusionsInput,
          setExclusionsInput,
          exclusionsTags,
          setExclusionsTags,
          exclusionsOptions,
          Colors.sooprslight,
          Colors.black,
          Colors.sooprsblue,
        )}

        {/* AMENITIES */}
        {renderTagSection(
          'AMENITIES',
          amenitiesInput,
          setAmenitiesInput,
          amenitiesTags,
          setAmenitiesTags,
          amenitiesOptions,
          Colors.sooprslight,
          Colors.black,
          Colors.sooprsblue,
        )}

        {/* Location 1 & Location 2 */}
        <View style={styles.rowContainer}>
          <View style={styles.colContainer}>
            <Text style={styles.label}>Location 1</Text>
            <TextInput
              style={styles.colInput}
              placeholder="e.g. Rishikesh"
              placeholderTextColor={Colors.grey}
              value={location1}
              onChangeText={setLocation1}
            />
          </View>
          <View style={styles.colContainer}>
            <Text style={styles.label}>Location 2</Text>
            <TextInput
              style={styles.colInput}
              placeholder="e.g. Rishikesh"
              placeholderTextColor={Colors.grey}
              value={location2}
              onChangeText={setLocation2}
            />
          </View>
        </View>

        {/* Base Price & Discount Price */}
        <View style={styles.rowContainer}>
          <View style={styles.colContainer}>
            <Text style={styles.label}>Base Price</Text>
            <TextInput
              style={styles.colInput}
              placeholder="Enter your base price"
              placeholderTextColor={Colors.grey}
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.colContainer}>
            <Text style={styles.label}>Discount Price</Text>
            <TextInput
              style={styles.colInput}
              placeholder="e.g. 5"
              placeholderTextColor={Colors.grey}
              value={discountPrice}
              onChangeText={setDiscountPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Charges/Day */}
        {/* <Text style={styles.label}>Charges/Day</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4"
          placeholderTextColor={Colors.grey}
          value={chargesPerDay}
          onChangeText={setChargesPerDay}
          keyboardType="numeric"
        /> */}

        {/* Upload Photos */}
        <Text style={styles.label}>
          Upload Photos<Text style={styles.required}>*</Text>
        </Text>
        
        <View style={styles.imagesRowContainer}>
          {/* Thumbnail Image (1 image) - Left Side */}
          <View style={styles.thumbnailContainer}>
            <Text style={styles.subLabel}>Thumbnail</Text>
            <View style={styles.uploadSlot}>
              {thumbnailImage ? (
                <>
                  <Image source={{uri: thumbnailImage}} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={removeThumbnailImage}>
                    <Image source={Images.deleteIcon} style={styles.removeIcon} />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.uploadArea}
                  onPress={pickThumbnailImage}>
                  <Image source={Images.imageIcon} style={styles.uploadIcon} />
                  <Text style={styles.uploadText}>Upload Thumbnail</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Default Images (max 4 images) - Right Side */}
          <View style={styles.defaultImagesContainer}>
            <Text style={styles.subLabel}>Default (Max 4)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.horizontalScrollView}
              contentContainerStyle={styles.defaultImagesRow}>
              {defaultImages.map((imageUri, index) => (
                <View key={index} style={styles.defaultImageSlot}>
                  <Image source={{uri: imageUri}} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDefaultImage(index)}>
                    <Image source={Images.deleteIcon} style={styles.removeIcon} />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {defaultImages.length < 4 && (
                <View style={styles.defaultImageSlot}>
                  <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={pickDefaultImage}>
                    <Image source={Images.imageIcon} style={styles.uploadIcon} />
                    <Text style={styles.uploadText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={createPackage}
          disabled={isSubmitting}>
          <Text style={styles.submitText}>
            {isSubmitting 
              ? (isEditMode ? 'Updating Package...' : 'Creating Package...') 
              : (isEditMode ? 'Update Package' : 'Add Package')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddPackagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  backIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    marginLeft: wp(4),
    color: Colors.black,
  },
  divider: {
    height: hp(0.1),
    backgroundColor: Colors.lightgrey2,
  },
  label: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    marginLeft: wp(5),
    marginTop: hp(2),
    color: Colors.black,
  },
  subLabel: {
    fontSize: FSize.fs12,
    fontWeight: '500',
    marginLeft: wp(5),
    marginTop: hp(1),
    color: Colors.grey,
  },
  required: {
    color: 'red',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
  },
  colContainer: {
    width: '47%',
  },
  colInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#A2A2A2',
    borderRadius: wp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
    fontSize: FSize.fs14,
    color: Colors.grey,
  },
  input: {
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#A2A2A2',
    borderRadius: wp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
    fontSize: FSize.fs14,
    color: Colors.grey,
  },
  textArea: {
    minHeight: hp(10),
    textAlignVertical: 'top',
    paddingTop: hp(1.8),
  },
  section: {
    marginTop: hp(1),
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
  },
  inputWithTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A2A2A2',
    borderRadius: wp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
    minHeight: hp(5),
    flexWrap: 'wrap',
  },
  inputWithTags: {
    flex: 1,
    fontSize: FSize.fs14,
    minWidth: wp(30),
    padding: 0,
  },
  tagsInsideInput: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  tagInsideInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(2.5),
    marginRight: wp(1.5),
    marginBottom: hp(0.3),
  },
  tagTextInsideInput: {
    fontSize: FSize.fs12,
    marginRight: wp(1),
  },
  tagRemoveInsideInput: {
    width: wp(3.5),
    height: wp(3.5),
    borderRadius: wp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveTextInsideInput: {
    fontSize: FSize.fs12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: hp(1),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(3),
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  tagText: {
    fontSize: FSize.fs13,
    marginRight: wp(1.5),
  },
  tagRemove: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRemoveText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '90%',
    alignSelf: 'center',
    marginTop: hp(0.5),
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(3),
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  addOptionText: {
    fontSize: FSize.fs13,
    fontWeight: '500',
  },
  imagesRowContainer: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    marginTop: hp(1),
    justifyContent: 'space-between',
  },
  thumbnailContainer: {
    width: '35%',
    alignItems: 'center',
    marginRight: wp(3),
  },
  defaultImagesContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  horizontalScrollView: {
    width: '100%',
  },
  defaultImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: wp(2),
  },
  defaultImageSlot: {
    width: wp(20),
    marginRight: wp(2),
    alignItems: 'center',
    flexShrink: 0,
  },
  uploadSlot: {
    width: '100%',
    alignItems: 'center',
  },
  uploadSlotActions: {
    width: '100%',
    marginTop: hp(0.5),
    alignItems: 'center',
  },
  uploadArea: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A2A2A2',
    borderRadius: wp(2),
    backgroundColor: Colors.lightgrey1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(2),
  },
  uploadIcon: {
    width: wp(8),
    height: wp(8),
    // tintColor: Colors.,
    marginBottom: hp(0.5),
  },
  uploadText: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: hp(0.5),
  },
  addButton: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    marginTop: hp(0.5),
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FSize.fs12,
    fontWeight: '600',
  },
  uploadedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: wp(2),
    backgroundColor: Colors.lightgrey1,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  removeIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: 'red',
    marginRight: wp(1),
  },
  removeText: {
    fontSize: FSize.fs12,
    color: 'red',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: wp(4),
    height: wp(4),
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(1),
    marginRight: wp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.sooprsblue,
    borderColor: Colors.sooprsblue,
  },
  checkboxIcon: {
    width: wp(2.5),
    height: wp(2.5),
    tintColor: Colors.white,
  },
  checkboxLabel: {
    fontSize: FSize.fs11,
    color: Colors.black,
  },
  submitBtn: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(2),
    borderRadius: wp(3),
    marginTop: hp(3),
    marginBottom: hp(4),
  },
  submitBtnDisabled: {
    backgroundColor: Colors.grey,
    opacity: 0.6,
  },
  submitText: {
    textAlign: 'center',
    fontSize: FSize.fs16,
    color: Colors.white,
    fontWeight: '600',
  },
});
