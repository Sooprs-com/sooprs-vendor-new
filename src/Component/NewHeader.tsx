import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  import React from 'react';
  import Colors from '../assets/commonCSS/Colors';
  import Images from '../assets/image';
  import FSize from '../assets/commonCSS/FSize';
  import {hp, wp} from '../assets/commonCSS/GlobalCSS';
  
  const NewHeader = ({header, navigation, hideBackButton = false, onBackPress}) => {
    const handleBackPress = () => {
      if (onBackPress) {
        onBackPress();
      } else {
        navigation.goBack();
      }
    };
  
    return (
      <View>
        <StatusBar
          barStyle={'light-content'}
          animated
          backgroundColor={Colors.sooprsDark}
        />
        <View style={styles.headerSection}>
          {!hideBackButton && (
            <TouchableOpacity
            style={{paddingTop:Platform.OS === 'ios' ? hp(6.7) : hp(2 )}}
              onPress={handleBackPress}>
              <Image
                source={Images.backArrow}
                resizeMode="contain"
                style={styles.backArrow}
                tintColor={Colors.white}
              />
            </TouchableOpacity>
          )}
          <Text
            style={{
              marginLeft:hideBackButton && 12,
              paddingTop: Platform.OS === 'ios' ? hp(7) : hp(2),
              color: Colors.white,
              fontWeight: '500',
              fontSize: FSize.fs16,
            }}>
            {header}
          </Text>
        </View>
      </View>
    );
  };
  
  export default NewHeader;
  
  const styles = StyleSheet.create({
    backArrow: {
      width: 25,
      height: 25,
      marginRight: 16,
    },
    headerSection: {
      flexDirection: 'row',
      backgroundColor: Colors.sooprsDark,
      paddingHorizontal: 16,
      paddingVertical: hp(3),
      height:Platform.OS === 'ios' ? hp(12) : hp(10),
    },
  });
  