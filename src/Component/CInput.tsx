import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Image,
  } from 'react-native';
  import React, {useState} from 'react';
  import Colors from '../assets/commonCSS/Colors';
  import {hp, wp} from '../assets/commonCSS/GlobalCSS';
  import Images from '../assets/image';
  import FSize from '../assets/commonCSS/FSize';
  
  const CInput = ({
    title,
    name,
    isPassword,
    loggedIn,
    newlabel,
    style,
    customInputStyle,
    value,
    setValue,
    keyboardType,
    multiline,
    numberOfLines
  }: {
    title: string;
    name: string;
    isPassword: boolean;
    loggedIn:boolean;
    newlabel:boolean;
    style: any;
    customInputStyle:any;
    value: string;
    setValue: any;
    keyboardType: string;
    multiline?: boolean;
    numberOfLines?: number;
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(isPassword);
  
    return (
      <View style={[styles.inputSection, style]}>
        {title && <Text style={[styles.label, newlabel && styles.newlabel]}>{title}</Text>}
        <View
          style={[
            styles.textInputSection,
            customInputStyle,
            isFocused && styles.inputSectionFocused,
          ]}>
          <TextInput
            style={[
              styles.input, // Use the flex to fill the space
              { textAlignVertical: multiline ? 'top' : 'center', fontSize: FSize.fs15, paddingLeft: wp(1), color: Colors.black },
            ]}
            placeholder={!isFocused ? `${name}` : ''}
            placeholderTextColor="#BCBCBC"
            value={value}
            onChangeText={setValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPasswordVisible}
            keyboardType={keyboardType === 'default' ? 'default' : keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
  
          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.passwordIconContainer}>
              <Image
                source={isPasswordVisible ? Images.eye : Images.eyec}
                resizeMode="contain"
                style={styles.imageStyle}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  export default CInput;
  
  const styles = StyleSheet.create({
    inputSection: {
      flexDirection: 'column',
      width: '100%',
      marginBottom: hp(2),
    },
    label: {
      color: Colors.black,
      fontFamily: 'inter',
      fontWeight: '400',
      fontSize: FSize.fs16,
      paddingBottom: hp(1),
    },
    newlabel: {
      position: 'relative',
      right: wp(35),
    },
    textInputSection: {
      paddingLeft: wp(2),
      borderWidth: 1,
      borderColor: '#D9D9D9',
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center', // Ensure alignment
      paddingHorizontal: wp(1),
    },
    input: {
      flex: 1, // Make sure the input takes full available width
      paddingVertical: hp(0.9),
      color: Colors.black,
    },
    inputSectionFocused: {
      borderWidth: 2,
      borderColor: Colors.black,
    },
    passwordIconContainer: {
      height: hp(3),
      width: hp(3),
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageStyle: {
      height: '100%',
      width: '100%',
      tintColor: Colors.black,
    },
  });
  