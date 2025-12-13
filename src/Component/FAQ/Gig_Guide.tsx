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
const Gig_Guide = () => {
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
        title: "How to earn money with Sooprs freelance work?",
        answer:
          "Sooprs offers freelancers valuable opportunities to earn money through a diverse range of projects. Freelancers can set their own rates, build strong portfolios, and connect with clients, enhancing their chances for higher-paying jobs. This platform empowers them to achieve financial freedom and enjoy a fulfilling career on their own terms.",
          isBulletPoint: false,
        },
      {
        id: "2",
        title: "How do I post a project on Sooprs for freelance services?",
        answer:
          `To post a freelance project on Sooprs, simply sign up as a client and navigate to the "Post a Project" option in the header of Sooprs.com. Alternatively, you can use this direct link: Post a Project`,
        isBulletPoint: false,
        },
      {
        id: "3",
        title: "How do I bid on freelance work for a project?",
        answer:
          `To bid on freelance projects, visit the "Browse Projects" section in the header or click this link: Browse Jobs. Navigate to any project by clicking on the arrow (->), then place your bid on the project detail page. Explore and participate in the best online marketplace for freelance services!`,
        isBulletPoint: false,
        },
      {
        id: "4",
        title: "How can I optimize my gig to attract more clients?",
        answer:
          `To enhance your gig's appeal:\nAdd relevant tags and technologies/skills.\nInclude high-quality photos and videos to showcase your work.`,
          isBulletPoint: true,
        },
      {
        id: "5",
        title: "Is there a limit to the number of gigs I can post?",
        answer:
          'No, you can post an unlimited number of gigs on Sooprs.',
          isBulletPoint: false,
        },
        {
            id: "6",
            title: "How do I edit or delete an existing gig?",
            answer:
              `To edit or delete a gig:\nLog in to your account.\nClick on your profile dropdown and select "Dashboard.\nNavigate to the "My Gigs" tab.\nClick on the three dots next to the gig you wish to modify, and choose "Edit" or "Delete" as needed.`,
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
  
export default Gig_Guide

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