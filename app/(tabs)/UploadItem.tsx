import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Loading from "../component/Loading";
import { useAuth } from "../context/AuthContext";
import { CategoryType, ItemDetailType } from "../types/types";
import { fetchWithTimeout } from "../utils/api";

const { width } = Dimensions.get("window");

// Pro Design Colors (Matched with Index.tsx)
const UI_COLORS = {
  primary: "#FF6B6B",
  secondary: "#007AFF",
  background: "#F8F9FA",
  cardBg: "#FFFFFF",
  textMain: "#1A1A1A",
  textSub: "#8E8E93",
  border: "#E5E5EA",
  inputBg: "#F2F2F7",
  danger: "#FF3B30",
};

export default function UploadItem() {
  const router = useRouter();
  const { userInfo, token, signOut } = useAuth();

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const queryString = useLocalSearchParams();
  const itemId = Number(queryString?.itemId || 0);
  const MAX_IMAGES = 5;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // --- Logic Functions ---

  async function getCategories(): Promise<CategoryType[]> {
    try {
      const response = await fetchWithTimeout(
        `${apiUrl}/api/item/get_categories`,
        { method: "GET" },
      );
      let result: any = await response.json();

      if (response?.ok && result?.success) {
        let _data: CategoryType[] = result?.data;
        setCategoryList(_data);
        return _data;
      } else {
        alert(`카테고리 가져오기 실패했습니다. ${result?.msg}`);
        return [];
      }
    } catch (error: any) {
      console.error("네트워크 에러:", error?.message);
      return [];
    }
  }

  async function getItem(currentCategories: CategoryType[]) {
    if (!itemId) return;

    try {
      const params = new URLSearchParams();
      params.append("item_id", String(itemId));

      const response = await fetchWithTimeout(
        `${apiUrl}/api/item/get_item_by_id?${params}`,
        {
          method: "GET",
          headers: { Authorization: `${token}` },
        },
      );
      let result: any = await response.json();

      if (response?.ok && result?.success) {
        let _data: ItemDetailType = result?.data;

        setTitle(_data.title || "");
        setContent(_data.content || "");
        setPrice(String(_data.price || ""));

        if (currentCategories && currentCategories.length > 0) {
          const targetCategory = currentCategories.find(
            (c) => c.id === _data.category_id,
          );
          if (targetCategory) {
            setSelectedCategory(targetCategory);
          }
        }

        if (_data.images && _data.images.length > 0) {
          const serverImageUrls = _data.images.map((img) => img.url);
          setImages(serverImageUrls);
        }
      } else {
        alert(`상품정보 가져오기 실패했습니다. ${result?.msg}`);
      }
    } catch (error: any) {
      alert(`서버와 연결할 수 없습니다. ${error?.message}`);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const fetchedCategories = await getCategories();

      if (!itemId || itemId === 0) {
        // New Item
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0]);
        }
        setTitle("");
        setContent("");
        setPrice("");
        setImages([]);
      } else {
        // Edit Item
        await getItem(fetchedCategories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        setTitle("");
        setContent("");
        setPrice("");
        setImages([]);
        setKeyboardVisible(false);
        setErrorMsg(null);
        setIsFocus(false);
      };
    }, [itemId]),
  );

  async function onUploadItem() {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!price.trim()) {
      alert("가격을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const API_URL = `${apiUrl}/api/item/upsert_item`;

    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("category_id", String(selectedCategory?.id || 0));
      formData.append("item_id", String(itemId));
      formData.append("title", title);
      formData.append("content", content);
      formData.append("price", String(price));

      for (const [index, imageUri] of images.entries()) {
        try {
          // If it's a remote URL (already uploaded), we might need to handle it differently
          // dependent on backend. Assuming backend handles "new files" largely.
          // If URI doesn't start with 'file://', it's likely an existing server URL.
          // Usually we don't re-upload server URLs.
          // logic check: current logic blindly fetches.
          // If it fetches a server URL, it gets the blob and re-uploads?
          // That works but is inefficient. For now, keeping original logic for safety.

          const response = await fetch(imageUri);
          const blob = await response.blob();
          const fileName = imageUri.split("/").pop() || `upload_${index}.jpg`;
          formData.append("files", blob, fileName);
        } catch (err) {
          console.error(`이미지 변환 실패 (${index}):`, err);
        }
      }

      const response = await fetchWithTimeout(API_URL, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response?.ok && result?.success) {
        alert("상품이 성공적으로 등록되었습니다.");
        router.replace("/");
      } else {
        alert(`저장에 실패했습니다. ${result?.msg}`);
      }
    } catch (error: any) {
      alert(`서버와 연결할 수 없습니다. ${error?.message}`);
    } finally {
      setLoading(false);
    }
  }

  const pickImages = async (): Promise<void> => {
    if (images.length >= MAX_IMAGES) {
      alert(`사진은 최대 ${MAX_IMAGES}장까지 가능합니다.`);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedAssets = result.assets;
      const currentCount = images.length;
      const remainingSlots = MAX_IMAGES - currentCount;

      if (selectedAssets.length > remainingSlots) {
        const allowedImages = selectedAssets
          .slice(0, remainingSlots)
          .map((asset) => asset.uri);
        setImages((prev) => [...prev, ...allowedImages]);
        alert(`최대 ${MAX_IMAGES}장까지 선택 가능하여 일부만 추가되었습니다.`);
      } else {
        const newImages = selectedAssets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
      }
    }
  };

  const removeImage = (indexToRemove: number): void => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const onAIAutoComplete = async () => {
    if (images.length === 0) {
      alert("AI 자동완성을 사용하려면 최소 1장의 사진이 필요합니다.");
      return;
    }

    setLoading(true);
    // TODO: Connect to actual AI API
    setTimeout(() => {
      setTitle("AI가 제안하는 상품 제목 예시");
      setContent(
        "이 곳에는 AI가 이미지 분석을 통해 생성한 상세 설명이 들어갑니다.\n\n- 상태: 좋음\n- 색상: 화면과 같음\n- 특징: AI가 감지한 주요 특징들",
      );

      // Auto-select a category if available
      if (categoryList.length > 0) {
        // Just picking the first one for demo purposes, or try to find one by name closest to prediction
        setSelectedCategory(categoryList[0]);
      }

      setLoading(false);
      alert("AI가 상품 정보를 생성했습니다! 내용을 확인해주세요.");
    }, 2000);
  };

  // --- Render ---

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={UI_COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {itemId ? "상품 수정" : "내 물건 팔기"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Image Section */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScrollContent}
          >
            {/* Add Button */}
            <TouchableOpacity
              onPress={pickImages}
              style={styles.addImageButton}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color={UI_COLORS.textSub} />
              <Text style={styles.addImageText}>
                {images.length}/{MAX_IMAGES}
              </Text>
            </TouchableOpacity>

            {/* Images List */}
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumbnail} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="close" size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 2. Form Section */}
        <View style={styles.formContainer}>
          {/* AI Autocomplete Button */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={onAIAutoComplete}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.aiButtonText}>AI 상품정보 자동완성</Text>
          </TouchableOpacity>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.textInput}
              placeholder="글 제목"
              placeholderTextColor={UI_COLORS.textSub}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>카테고리</Text>
            <Dropdown
              style={[
                styles.dropdown,
                isFocus && { borderColor: UI_COLORS.primary },
              ]}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={categoryList}
              search
              maxHeight={300}
              labelField="name"
              valueField="id"
              placeholder={!isFocus ? "카테고리 선택" : "..."}
              searchPlaceholder="검색..."
              value={selectedCategory?.id}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setSelectedCategory(item);
                setIsFocus(false);
              }}
            />
          </View>

          {/* Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>가격</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>₩</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="가격 입력 (선택사항)"
                placeholderTextColor={UI_COLORS.textSub}
                value={price}
                keyboardType="number-pad"
                onChangeText={(e) => {
                  const numericValue = e.replace(/[^0-9]/g, "");
                  setPrice(numericValue);
                }}
              />
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={styles.textArea}
              placeholder={`상품 설명을 입력해주세요.\n(가품 및 판매금지품목은 게시가 제한될 수 있어요.)`}
              placeholderTextColor={UI_COLORS.textSub}
              value={content}
              multiline={true}
              scrollEnabled={false} // Let the parent scroll view handle scrolling if needed, or set true based on content
              onChangeText={setContent}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer / Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={onUploadItem}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {itemId ? "수정 완료" : "작성 완료"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Loading
        visible={loading}
        text={itemId ? "불러오는 중..." : "업로드 중..."}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
    backgroundColor: "white",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: UI_COLORS.textMain,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Images
  section: {
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: UI_COLORS.background, // Divider effect
  },
  imageScrollContent: {
    paddingHorizontal: 20,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderStyle: "dashed", // Not always supported perfectly on Android, but usually works
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: UI_COLORS.background,
  },
  addImageText: {
    fontSize: 12,
    color: UI_COLORS.textSub,
    marginTop: 4,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: UI_COLORS.textMain,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "white",
  },
  // Form
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: UI_COLORS.textMain,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: UI_COLORS.textMain,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
    paddingVertical: 8,
  },
  // Dropdown
  dropdown: {
    height: 50,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  dropdownContainer: {
    borderRadius: 12,
    marginTop: 4,
    borderColor: UI_COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderStyle: {
    fontSize: 16,
    color: UI_COLORS.textSub,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: UI_COLORS.textMain,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  // Price
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 18,
    color: UI_COLORS.textMain,
    marginRight: 8,
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: UI_COLORS.textMain,
    fontWeight: "600",
  },
  // TextArea
  textArea: {
    fontSize: 16,
    color: UI_COLORS.textMain,
    textAlignVertical: "top",
    minHeight: 150,
    lineHeight: 24,
  },
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
    backgroundColor: "white",
  },
  submitButton: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  // AI Button
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9D50BB", // A nice purple for AI/Magic feel
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: "#9D50BB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
