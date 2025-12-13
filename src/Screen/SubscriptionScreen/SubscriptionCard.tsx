import {Image, StyleSheet, Text, TouchableOpacity, View, FlatList} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Images from '../../assets/image';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';

const SubscriptionCard = ({data = [], selectedTab = 0, setActiveItem = {}}) => {
  const GlowingView = ({discount}) => {
    return (
      <LinearGradient
        colors={['#9747FF', '#00C6FF']} // Gradient for glowing border
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.glowingBorder}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>{discount}</Text>
        </View>
      </LinearGradient>
    );
  };
  const renderCard = ({item, index}) => {
    const tags = item?.description ?? [];
    const discount = `${item?.discount}% Benefit`;
    const planName = item?.plan_name ?? '';
    const price =
      selectedTab == 0
        ? `₹${item?.month_price}/Monthly`
        : `₹${item?.year_price}/Annually`;
    return (
      <LinearGradient
        key={index}
        colors={['#9747FF', '#0068FF']} // Gradient colors
        start={{x: 0, y: 1}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        <View style={styles.cardContent}>
          <Text style={styles.planText}>{planName}</Text>
          <Text style={styles.des}>
            "Get started with the essentials! Perfect for beginners looking to
            explore opportunities and build their profile."
          </Text>
          <Text style={styles.priceText}>{price}</Text>
          <GlowingView discount={discount} />
          <View style={styles.border} />
          {tags.map((item, index) => {
            return (
              <View key={index} style={styles.tagContainer}>
                <Image
                  source={Images.checkblue}
                  style={{height: 20, width: 20, marginRight: 12}}
                  resizeMode="contain"
                  tintColor={Colors.white}
                />
                <Text style={styles.tagText}>{item}</Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    );
  };
  // handle scroll
  const handleScrollEnd = event => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (wp(80) + 20 * 2));
    setActiveItem(data[index]);
  };
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No subscription plans available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        snapToInterval={wp(80) + 20 * 2}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        onMomentumScrollEnd={handleScrollEnd}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
      />
    </View>
  );
};

export default SubscriptionCard;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
  gradient: {
    width: wp(80),
    borderRadius: 15,
    padding: 2,
    minHeight: hp(54),
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#070A29',
    borderRadius: 12,
    padding: 10,
  },
  flatListContent: {
    paddingHorizontal: (wp(100) - wp(80)) / 2, 
  },
  separator: {
    width: 20, // Gap between cards
  },
  planText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: FSize.fs24,
  },
  des: {color: '#D9D9D999', fontSize: FSize.fs12},
  priceText: {
    color: Colors.white,
    fontWeight: '400',
    fontSize: FSize.fs28,
    marginVertical: 10,
  },

  glowingBorder: {
    padding: 1,
    width: '40%',
    borderRadius: 10,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#070A29',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff', // Button text color
    fontWeight: '400',
    fontSize: FSize.fs14,
  },
  border: {
    height: 0,
    borderTopWidth: 0.5,
    borderColor: Colors.white,
    marginVertical: hp(3),
  },
  tagText: {color: Colors.white, fontSize: FSize.fs16, fontWeight: '500'},
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyText: {
    color: Colors.white,
    textAlign: 'center',
    fontSize: FSize.fs16,
    marginTop: hp(5),
  },
});
