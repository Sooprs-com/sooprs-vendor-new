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
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';

interface ImageData {
  uri: string;
  isThumbnail: boolean;
  isDefault: boolean;
}

const AddPackagesScreen = () => {
  const navigation = useNavigation();

  const [packageName, setPackageName] = useState(
    'Healing & Wellness Retreat - Rishikesh 5N/6D',
  );
  const [shortDescription, setShortDescription] = useState(
    'Detox your mind & body with yoga, meditation, Ayurveda therapies & Ganga-side healing experience in the foothills of the Himalayas.',
  );
  const [longDescription, setLongDescription] = useState(
    'A transformative wellness journey with daily yoga & meditation sessions, Ayurvedic massage & spa treatments, sound healing, mindfulness workshops, Ganga Aarti experience, organic meals, Himalayan trekking & river-side relaxation. Perfect for stress relief, burnout recovery & inner peace seekers. Includes luxury wellness resort stay, private instructor & full retreat coordination.',
  );

  // Inclusions
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [inclusionsTags, setInclusionsTags] = useState([
    'Pickup & Drop',
    'Himalayan Trek',
  ]);
  const inclusionsOptions = [
    'Daily Yoga & Meditation Sessions',
    'Ayurvedic Spa & Massage Treatments',
    'Detox Diet - Breakfast, Lunch & Dinner',
  ];

  // Exclusions
  const [exclusionsInput, setExclusionsInput] = useState('');
  const [exclusionsTags, setExclusionsTags] = useState([
    'Personal Shopping',
    'Adventure Sports',
  ]);
  const exclusionsOptions = [
    'Photography & Videography',
    'Private Ayurveda Doctor Consultation',
  ];

  // Amenities
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [amenitiesTags, setAmenitiesTags] = useState([
    'Herbal Tea Lounge',
    'Food Menu',
  ]);
  const amenitiesOptions = [
    'Herbal Tea Lounge',
    '24x7 Wellness Support',
    'In-house Ayurveda Center',
  ];

  // Location and Pricing
  const [location1, setLocation1] = useState('');
  const [location2, setLocation2] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [chargesPerDay, setChargesPerDay] = useState('');

  // Images
  const [images, setImages] = useState<ImageData[]>([
    {uri: '', isThumbnail: true, isDefault: false},
    {uri: '', isThumbnail: false, isDefault: false},
    {uri: '', isThumbnail: false, isDefault: false},
  ]);

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

  const pickImage = (index: number) => {
    try {
      if (!ImagePicker || !ImagePicker.launchImageLibrary) {
        Alert.alert('Error', 'Image picker is not available. Please rebuild the app.');
        console.log('ImagePicker not available');
        return;
      }

      const options: any = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      ImagePicker.launchImageLibrary(options, (response: ImagePicker.ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }
        
        if (response.errorCode) {
          let errorMessage = 'Failed to pick image';
          if (response.errorCode === 'permission') {
            errorMessage = 'Permission denied. Please allow photo library access in settings.';
          } else if (response.errorCode === 'others') {
            errorMessage = response.errorMessage || 'Unknown error occurred';
          }
          Alert.alert('Error', errorMessage);
          console.log('ImagePicker Error: ', response.errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
          const newImages = [...images];
          newImages[index] = {
            ...newImages[index],
            uri: response.assets[0].uri,
          };
          setImages(newImages);
        } else {
          Alert.alert('Error', 'No image selected');
        }
      });
    } catch (error) {
      console.log('ImagePicker Exception: ', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = {uri: '', isThumbnail: false, isDefault: false};
    setImages(newImages);
  };

  const toggleThumbnail = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isThumbnail: i === index,
    }));
    setImages(newImages);
  };

  const toggleDefault = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isDefault: i === index,
    }));
    setImages(newImages);
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
      <TextInput
        style={styles.input}
        placeholder={`e.g ${label === 'INCLUSIONS' ? 'Healing workshops' : label === 'EXCLUSIONS' ? 'Airfare' : 'Spa & Sauna'}`}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => addTag(tags, setTags, input, setInput)}
        multiline={false}
      />

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag: string, index: number) => (
            <View
              key={index}
              style={[styles.tag, {backgroundColor: tagColor}]}>
              <Text style={[styles.tagText, {color: tagTextColor}]}>
                {tag}
              </Text>
              <TouchableOpacity
                onPress={() => removeTag(tags, setTags, index)}
                style={[
                  styles.tagRemove,
                  {backgroundColor: removeIconColor},
                ]}>
                <Text
                  style={[
                    styles.tagRemoveText,
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
          <Text style={styles.headerTitle}>Add Packages</Text>
        </View>

        <View style={styles.divider} />

        {/* PACKAGE NAME */}
        <Text style={styles.label}>PACKAGE NAME</Text>
        <TextInput
          style={styles.input}
          value={packageName}
          onChangeText={setPackageName}
          placeholder="Enter package name"
        />

        {/* SHORT DESCRIPTION */}
        <Text style={styles.label}>SHORT DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="Enter short description"
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
          multiline
          numberOfLines={6}
        />

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
          Colors.lightgrey1,
          Colors.black,
          Colors.grey,
        )}

        {/* AMENITIES */}
        {renderTagSection(
          'AMENITIES',
          amenitiesInput,
          setAmenitiesInput,
          amenitiesTags,
          setAmenitiesTags,
          amenitiesOptions,
          Colors.lightgrey1,
          Colors.black,
          Colors.grey,
        )}

        {/* Location 1 */}
        <Text style={styles.label}>Location 1</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rishikesh"
          value={location1}
          onChangeText={setLocation1}
        />

        {/* Location 2 */}
        <Text style={styles.label}>Location 2</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rishikesh"
          value={location2}
          onChangeText={setLocation2}
        />

        {/* Base Price */}
        <Text style={styles.label}>Base Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your base price"
          value={basePrice}
          onChangeText={setBasePrice}
          keyboardType="numeric"
        />

        {/* Discount Price */}
        <Text style={styles.label}>Discount Price</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          value={discountPrice}
          onChangeText={setDiscountPrice}
          keyboardType="numeric"
        />

        {/* Charges/Day */}
        <Text style={styles.label}>Charges/Day</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4"
          value={chargesPerDay}
          onChangeText={setChargesPerDay}
          keyboardType="numeric"
        />

        {/* Upload Photos */}
        <Text style={styles.label}>
          Upload Photos<Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.uploadContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.uploadSlot}>
              {image.uri ? (
                <>
                  <Image source={{uri: image.uri}} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => toggleThumbnail(index)}>
                    <View
                      style={[
                        styles.checkbox,
                        image.isThumbnail && styles.checkboxChecked,
                      ]}>
                      {image.isThumbnail && (
                        <Image
                          source={Images.checkedCheckBox}
                          style={styles.checkboxIcon}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as Thumbnail</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => toggleDefault(index)}>
                    <View
                      style={[
                        styles.checkbox,
                        image.isDefault && styles.checkboxChecked,
                      ]}>
                      {image.isDefault && (
                        <Image
                          source={Images.checkedCheckBox}
                          style={styles.checkboxIcon}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as Default</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={() => pickImage(index)}>
                    <Image
                      source={Images.imageIcon}
                      style={styles.uploadIcon}
                    />
                    <Text style={styles.uploadText}>No Photo Uploaded</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => pickImage(index)}>
                      <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => toggleDefault(index)}>
                    <View
                      style={[
                        styles.checkbox,
                        image.isDefault && styles.checkboxChecked,
                      ]}>
                      {image.isDefault && (
                        <Image
                          source={Images.checkedCheckBox}
                          style={styles.checkboxIcon}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as Default</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Image Guidelines */}
        <Text style={styles.label}>Image Guidelines</Text>
        <View style={styles.guidelinesContainer}>
          <View style={styles.guidelineItem}>
            <View style={styles.guidelineImage}>
              <Text style={styles.guidelinePlaceholder}>Image</Text>
            </View>
            <View style={styles.guidelineCheck}>
              <Text style={styles.guidelineCheckText}>✓</Text>
            </View>
            <Text style={styles.guidelineLabel}>Clear Picture</Text>
          </View>
          <View style={styles.guidelineItem}>
            <View style={styles.guidelineImage}>
              <Text style={styles.guidelinePlaceholder}>Image</Text>
            </View>
            <View style={styles.guidelineCross}>
              <Text style={styles.guidelineCrossText}>×</Text>
            </View>
            <Text style={styles.guidelineLabel}>Blurred Photo</Text>
          </View>
          <View style={styles.guidelineItem}>
            <View style={styles.guidelineImage}>
              <Text style={styles.guidelinePlaceholder}>Image</Text>
            </View>
            <View style={styles.guidelineCross}>
              <Text style={styles.guidelineCrossText}>×</Text>
            </View>
            <Text style={styles.guidelineLabel}>Blurred Photo</Text>
          </View>
          <View style={styles.guidelineItem}>
            <View style={styles.guidelineImage}>
              <Text style={styles.guidelinePlaceholder}>Image</Text>
            </View>
            <View style={styles.guidelineCross}>
              <Text style={styles.guidelineCrossText}>×</Text>
            </View>
            <Text style={styles.guidelineLabel}>Watermark</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>Add Package</Text>
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
  required: {
    color: 'red',
  },
  input: {
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
    fontSize: FSize.fs14,
  },
  textArea: {
    minHeight: hp(10),
    textAlignVertical: 'top',
    paddingTop: hp(1.8),
  },
  section: {
    marginTop: hp(1),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '90%',
    alignSelf: 'center',
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
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: hp(1),
  },
  uploadSlot: {
    width: '30%',
  },
  uploadArea: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    backgroundColor: Colors.lightgrey1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(2),
  },
  uploadIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: Colors.sooprsblue,
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
    alignSelf: 'center',
    marginTop: hp(0.5),
  },
  removeText: {
    fontSize: FSize.fs12,
    color: 'red',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
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
  guidelinesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: hp(1),
  },
  guidelineItem: {
    alignItems: 'center',
    width: '23%',
  },
  guidelineImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.lightgrey1,
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
  },
  guidelinePlaceholder: {
    fontSize: FSize.fs10,
    color: Colors.grey,
  },
  guidelineCheck: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.5),
  },
  guidelineCheckText: {
    color: Colors.white,
    fontSize: FSize.fs12,
    fontWeight: '700',
  },
  guidelineCross: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.5),
  },
  guidelineCrossText: {
    color: Colors.white,
    fontSize: FSize.fs14,
    fontWeight: '700',
  },
  guidelineLabel: {
    fontSize: FSize.fs10,
    color: Colors.black,
    marginTop: hp(0.5),
    textAlign: 'center',
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
  submitText: {
    textAlign: 'center',
    fontSize: FSize.fs16,
    color: Colors.white,
    fontWeight: '600',
  },
});
