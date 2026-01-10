import { Modal, Button, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
// import Images from '../../assets/image';


const ChatbotSupport = ({}) => {
    const [modalVisible, setModalVisible] = useState(true);    
  return (   
        // <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex:1,paddingTop: hp(5),paddingBottom: hp(3),backgroundColor: 'white'}}>
        <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={{
              position: 'absolute',
              top: hp(2),
              right: wp(20),
              zIndex: 1,
              // backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: 10,
              borderRadius: 20,
            }}
          >
              {/* <Image source={Images.crossIcon} style={{ height: hp(5), width: wp(5) }} /> */}
                 
          </TouchableOpacity>
          <WebView source={{ uri: 'https://tawk.to/chat/694e845bd28d35197f087513/1jdfe51r3' }} style={{ flex: 1 }} />
        </View>
      // </Modal>
  )
  {/* <Button title="Open Chat" onPress={() => setModalVisible(true)} /> */}
}

export default ChatbotSupport

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
})