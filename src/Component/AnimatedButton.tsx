// AnimatedButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import { hp, wp } from '../assets/commonCSS/GlobalCSS';
import Images from '../assets/image';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const AnimatedButton = ({
    onPress,
    title="Search Flights",
    buttonStyle,
    textStyle,
    icon,
    gradientColors = ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)'],
    duration = 2000,
}) => {
    const [width, setWidth] = useState(0);
    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    useEffect(() => {
        if (width <= 0) return;
        translateX.value = -width;
        translateX.value = withRepeat(
            withTiming(width, {
                duration,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [width, duration, translateX]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.button, buttonStyle]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w !== width) {
                    setWidth(w);
                }
            }}
        >

            <Image source={icon} style={{width: hp(1.9), height: hp(1.9),tintColor:"rgba(249, 203, 21, 1)"}}/>
            <Text style={[styles.text, textStyle]}>{title}</Text>
            {width > 0 && (
                <AnimatedGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.overlay,
                        { width: width / 1.2 },
                        animatedStyle,
                    ]}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        ...Platform.select({
            ios: {},
            android: {
                elevation: 15,
                shadowColor: Colors.primary
            }
        }),
        backgroundColor: 'rgba(0, 104, 255, 1)',
        paddingVertical:hp(.5),
        flexDirection: 'row',
        paddingHorizontal: wp(2),
        gap: wp(2),
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: Colors.white,
        fontSize: FSize.fs16,
        fontWeight: '600',
        zIndex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        opacity: 0.75,
    },
});

export default AnimatedButton;
