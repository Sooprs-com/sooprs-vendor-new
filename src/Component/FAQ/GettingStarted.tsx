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

export const GettingStarted = () => {
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
      title: "What is Sooprs freelance marketplace?",
      answer:
        "Sooprs is a freelance marketplace that connects businesses with highly skilled and vetted professionals across various fields. It focuses on providing top-quality freelance services, ensuring that clients receive reliable, result-oriented solutions. With features like post-project support, payment protection, and verified experts, Sooprs aims to deliver an efficient, secure, and professional experience for businesses seeking freelance talent.",
        isBulletPoint: false,
      },
    {
      id: "2",
      title: "How do I get started on freelance work on Sooprs?",
      answer:
        "Register/Login: Create an account on Sooprs.com. Purchase Membership: Choose and buy your membership. Browse Projects: Explore available freelance projects. Bid on Projects: Submit your bid with the proposed amount. Client Review: Clients review your profile and proposal. Client Accepts Bid: Client accepts your bid. Start Work: Begin your project upon acceptance.",
      isBulletPoint: false,
      },
    {
      id: "3",
      title: "How to earn money with Sooprs freelance work?",
      answer:
        "Sooprs offers freelancers valuable opportunities to earn money through a diverse range of projects. Freelancers can set their own rates, build strong portfolios, and connect with clients, enhancing their chances for higher-paying jobs. This platform empowers them to achieve financial freedom and enjoy a fulfilling career on their own terms.",
      isBulletPoint: false,
      },
    {
      id: "4",
      title: "What should I do if I forget my password?",
      answer:
        'If you\'ve forgotten your password: \nOn the login page, click on "Lost Your Password" to reset it via email.\nTo change your password after logging in:\nClick on your profile dropdown and select "Dashboard."\nNavigate to "Settings."\nUse the "Change Password" option to update your password.',
        isBulletPoint: true,
      },
    {
      id: "5",
      title: "What is Sooprs freelance marketplace?",
      answer:
        'To verify your account, follow these steps:\nLog in to your Sooprs account.\nClick on your profile dropdown and select "Dashboard."\nNavigate to "Settings."\nLocate the "KYC" option and complete the verification process to receive a verified badge.',
        isBulletPoint: true,
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

