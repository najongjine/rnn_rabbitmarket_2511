import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Loading from "../component/Loading";
import { useAuth } from "../context/AuthContext";
import { CategoryType, ItemDetailType } from "../types/types";
import { fetchWithTimeout } from "../utils/api";

const { width } = Dimensions.get("window");

// Pro Design Colors
const UI_COLORS = {
  primary: "#FF6B6B",
  secondary: "#007AFF", // Added missing secondary color
  background: "#F8F9FA",
  cardBg: "rgba(255, 255, 255, 0.95)", // High opacity for readability over Lottie
  textMain: "#1A1A1A",
  textSub: "#8E8E93",
  border: "#E5E5EA",
  shadow: "#000000",
};

export default function HomeScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const router = useRouter();

  // User Info & Auth
  const { userInfo, token, signOut } = useAuth(); // Keeping this as per original

  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null,
  );
  const [items, setItems] = useState<ItemDetailType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Data Loading Logic
  async function loadData() {
    try {
      setLoading(true);
      const fetchedCategories = await getCategories();
      if (fetchedCategories.length > 0) {
        if (!selectedCategory) {
          // Logic handled in getCategories
        }
        await getItems(fetchedCategories[0].id);
      } else {
        await getItems(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectCategory = async (category: CategoryType) => {
    setSelectedCategory(category);
    await getItems(category.id);
  };

  async function getItems(categoryId?: number) {
    try {
      setLoading(true);
      const targetCategoryId = categoryId ?? selectedCategory?.id ?? 0;

      const queryParams = new URLSearchParams();
      if (targetCategoryId !== 0) {
        queryParams.append("category_id", String(targetCategoryId));
      }
      if (searchKeyword) {
        queryParams.append("search_keyword", searchKeyword?.trim());
      }

      const url = `${apiUrl}/api/item/get_items?${queryParams.toString()}`;
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      let result: any = await response.json();

      if (response?.ok && result?.success) {
        setItems(result.data);
      } else {
        console.log("Failed to fetch items:", result?.msg);
      }
    } catch (error: any) {
      console.error("Error fetching items:", error?.message);
    } finally {
      setLoading(false);
    }
  }

  async function getCategories(): Promise<CategoryType[]> {
    try {
      const response = await fetchWithTimeout(
        `${apiUrl}/api/item/get_categories`,
        {
          method: "GET",
        },
      );
      let result: any = await response.json();

      if (response?.ok && result?.success) {
        let _data: CategoryType[] = result?.data;
        const allCategory: CategoryType = { id: 0, name: "전체", order_no: 0 };
        const newList = [allCategory, ..._data];
        setCategoryList(newList);

        // Set default if strictly needed here, though explicit 'null' check in state is safer visually
        if (!selectedCategory) {
          setSelectedCategory(newList[0]);
        }

        return newList;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error("Network error:", error?.message);
      return [];
    }
  }

  useFocusEffect(
    useCallback(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        () => setKeyboardVisible(true),
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        () => setKeyboardVisible(false),
      );

      loadData();

      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
        setKeyboardVisible(false);
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={UI_COLORS.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]} // Making the Category section sticky (index 2: Hero=0, Search=1, Category=2)
      >
        {/* 1. Header Section (Preserving Lottie) */}
        <View style={styles.headerContainer}>
          <LottieView
            source={require("../../assets/lottie/Bunny_Hop.json")}
            style={styles.headerLottie}
            autoPlay
            loop
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>토끼마켓</Text>
            {/* If Logout button was implied to be here, we can add it, but user said "Leaf it alone" so we keep structure similar but cleaner */}
          </View>
          {/* Adding strict logout button if user implies "Logout Design" must be kept/added */}
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
              placeholderTextColor={UI_COLORS.textSub}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onSubmitEditing={() => getItems()}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => getItems()}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Categories (Sticky Index 2) */}
        <View style={styles.categoryWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categoryList.map((cat, index) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectCategory(cat)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. List Content (Index 3) */}
        <View style={styles.contentContainer}>
          {/* Item List (Cards) */}
          <View style={styles.listContainer}>
            <Text style={styles.listHeaderTitle}>상품 목록</Text>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                style={styles.card}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/Detail",
                    params: { item_id: item.item_id },
                  });
                }}
              >
                <View style={styles.cardImageWrapper}>
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images[0].url }}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={styles.noImageText}>No Image</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {item.price?.toLocaleString()}원
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardAddress}>
                      {item.addr}{" "}
                      {item.distance_m
                        ? `(${Math.round(item.distance_m)}m)`
                        : ""}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {items.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  등록된 상품이 없습니다.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({ pathname: "/UploadItem", params: { itemId: 0 } })
        }
      >
        <Text style={styles.fabText}>상품+</Text>
      </TouchableOpacity>

      <Loading visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  // Header
  headerContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: UI_COLORS.background,
    position: "relative", // For logout button positioning
  },
  headerLottie: {
    width: 100,
    height: 100,
  },
  headerTextContainer: {
    alignItems: "center",
    marginTop: -10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: UI_COLORS.textMain,
    letterSpacing: -1,
  },
  logoutButton: {
    position: "absolute",
    right: 20,
    top: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: UI_COLORS.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    shadowColor: UI_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: UI_COLORS.textMain,
    height: 40,
  },
  searchButton: {
    backgroundColor: UI_COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Content
  contentContainer: {
    minHeight: 600,
    position: "relative",
    backgroundColor: "transparent", // Transparent to show lottie if behind, but lottie is inside
  },
  // Categories
  categoryWrapper: {
    paddingVertical: 15,
    backgroundColor: "rgba(248, 249, 250, 0.8)", // Slight blur background for sticky header effect
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: UI_COLORS.textMain,
    borderColor: UI_COLORS.textMain,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: UI_COLORS.textSub,
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: UI_COLORS.textMain,
  },
  card: {
    backgroundColor: UI_COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    padding: 12,
    shadowColor: UI_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  cardImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  noImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 10,
    color: "#999",
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: UI_COLORS.textMain,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: UI_COLORS.textMain,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardAddress: {
    fontSize: 13,
    color: UI_COLORS.textSub,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateText: {
    color: UI_COLORS.textSub,
    fontSize: 15,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: UI_COLORS.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  fabText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
