import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
  } from 'react-native-responsive-screen';
  import Colors from './Colors';
  import {fFamily} from './fFamily';
  // import { fFamily } from './fFomily';
  // import Colors from './Colors';
  
  const GlobalCss = {
    rowBase: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    fdraic: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    aicjcC: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    fdrsbp6: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: wp(6),
    },
  
    bBold: {
      fontWeight: '700',
      color: Colors.black,
    },
    shadowBox: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: hp(0.2),
      elevation: 2, // For Android
      // shadowColor: 'black',
      // shadowOffset: {
      //   width: 1,
      //   height: 1,
      // },
      // shadowOpacity: 0.25,
      // shadowRadius: 0,
      // elevation: 1.5,
    },
    boxShadowx: {
      borderWidth: hp(0.1),
      borderColor: '#ECECEC',
      marginTop: hp(1.5),
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      borderRadius: hp(1),
      backgroundColor: Colors.white,
    },
  
    // title
  
    ibm858585: {
      fontfamily: fFamily.ibmRegular,
      color: Colors.grey,
    },
    input: {
      width: '100%',
      padding: hp(1.5),
      borderWidth: 0,
      color: 'black',
    },
  };
  export {hp, wp, GlobalCss};