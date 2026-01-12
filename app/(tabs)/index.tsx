import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [categories, setCategories] = useState<string[]>([
    "이비인후과",
    "내과",
    "성형외과",
    "신경과",
    "안과",
    "정형외과",
    "피부과",
  ]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>내 주변 병원 찾기</Text>
          <Text style={styles.headerTitle}>어디가 불편하신가요?</Text>
        </View>

        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image
            style={styles.heroImage}
            source={require("../../assets/images/home_img.jpg")}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <Text style={styles.heroText}>빠르고 간편한{"\n"}근처 병원 찾기</Text>
        </View>

        {/* Categories Grid Section */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>진료과목 선택</Text>

          <View style={styles.gridContainer}>
            {categories?.length &&
              categories.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: "/Search",
                        params: { searchKeyword: String(item) },
                      });
                    }}
                  >
                    <View style={styles.cardContent}>
                      {/* 아이콘 Placeholder (첫 글자) */}
                      <View style={styles.iconPlaceholder}>
                        <Text style={styles.iconText}>{item[0]}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{item}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // 연한 회색 배경
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingTop: 20, // 상단 여백 약간 조정
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#333",
  },

  // Hero Image Styles
  heroContainer: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    height: 160,
    position: "relative",
    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroText: {
    position: "absolute",
    bottom: 20,
    left: 20,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },

  // Category Styles
  categoryContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Card Styles
  card: {
    width: (width - 48 - 15) / 2, // (화면너비 - 패딩 - 사이간격) / 2
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    // 카드 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },

  // Icon Placeholder Styles
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E88E5",
  },
});
