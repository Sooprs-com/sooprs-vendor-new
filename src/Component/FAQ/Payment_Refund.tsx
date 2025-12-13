import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import React, { useState } from "react";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import FSize from "../../assets/commonCSS/FSize";
import Images from "../../assets/image";

const QuestionContainer = ({ item, title, isDropDownVisible, toggleDropdown,isBulletPoint }) => {
    const lines = item.split("\n");
    return (
      <TouchableOpacity onPress={toggleDropdown} style={styles.container}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{title}</Text>
          <TouchableOpacity onPress={toggleDropdown}>
            <Image
              source={Images.downArrowLight}
              style={[styles.icon, { transform: [{ rotate: isDropDownVisible ? "180deg" : "0deg" }] }]}
            />
          </TouchableOpacity>
        </View>
        {/* {isDropDownVisible && <Text style={styles.item}>{item}</Text>} */}
        {isDropDownVisible && (
          <Text style={styles.item}>
            {lines[0]} {/* Display the first line normally */}
  
            {isBulletPoint &&
              lines.slice(1).map((line, index) => (
                <Text key={index}>{"\n"}• {line}</Text> // Bullet points from second line
              ))}
  
            {/* If bullet points are not needed, display the remaining lines without bullets */}
            {!isBulletPoint &&
              lines.slice(1).map((line, index) => (
                <Text key={index}>{"\n"}{line}</Text>
              ))}
          </Text>
        )}
          
      </TouchableOpacity>
    );
  };

const Payment_Refund = () => {
const [visibleDropdowns, setVisibleDropdowns] = useState({});

  // Function to toggle a specific dropdown
  const toggleDropdown = (index) => {
    setVisibleDropdowns((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const questions = [
    {
      id: "1",
      title: "How do I bid on freelance work for a project?",
      answer:
        `To bid on freelance projects, visit the "Browse Projects" section in the header or click this link: Browse Jobs. Navigate to any project by clicking on the arrow (->), then place your bid on the project detail page. Explore and participate in the best online marketplace for freelance services!`,
        isBulletPoint: false,
      },
    {
      id: "2",
      title: "Is there a fee to post a project for freelancing services?",
      answer:
        `No, Sooprs offers the best freelance marketplace, where you can post your projects free of cost! Enjoy the convenience and time-saving benefits of hassle-free project posting.`,
      isBulletPoint: false,
      },
    {
      id: "3",
      title: "Is there any fee to place a bid on a project?",
      answer:
        `Yes, we offer free credits for placing bids on projects. Once you reach a threshold limit, you can recharge your credit wallet. This allows you to bid on more great freelancing projects`,
      isBulletPoint: false,
      },
    {
      id: "4",
      title: "How long does it take to process a withdrawal?",
      answer:
        'Please refer to our Refund Policyfor detailed information.',
        isBulletPoint: false,
      },
    {
      id: "5",
      title: "Are there any fees associated with withdrawals or deposits?",
      answer:
        'For information on fees related to withdrawals or deposits, please consult our Refund Policy.',
        isBulletPoint: false,
      },
      {
        id: "6",
        title: "What is the procedure if a client disputes a payment?",
        answer:
          'In the event of a payment dispute, please review our Refund Policy for guidance.',
          isBulletPoint: false,
        },
  ];

  return (
    <View style={styles.screen}>
      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <QuestionContainer
            title={item.title}
            item={item.answer}
            isDropDownVisible={visibleDropdowns[index]}
            toggleDropdown={() => toggleDropdown(index)}
            isBulletPoint={item.isBulletPoint}
          />
        )}
      />
    </View>
  );
};

export default Payment_Refund
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    backgroundColor: "white",
    width: "100%",
  },
  questionContainer: {
    backgroundColor: "white",
    width: "100%",
    marginTop: hp(1),
    borderRadius: hp(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
  },
  questionText: {
    color: "#000",
    fontSize: FSize.fs16,
    fontWeight: "bold",
    flex: 1,
  },
  icon: {
    height: hp(2),
    width: hp(2),
  },
  item: {
    fontSize: FSize.fs15,
    color: "black",
    lineHeight: 22,
    paddingHorizontal: wp(3),
    marginVertical: 2,
  },
});