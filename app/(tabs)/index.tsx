import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Keyboard,
  ScrollView,
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

export default function HomeScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const router = useRouter();
  // 유저정보 관련 기능
  const { userInfo, token, signOut } = useAuth();
  // 유저정보 관련 기능 END
  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(
    categoryList[0],
  );
  const [items, setItems] = useState<ItemDetailType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ★ 데이터 로딩 순서 제어 함수
  // ★ 데이터 로딩 순서 제어 함수
  async function loadData() {
    try {
      setLoading(true);
      // 1. 카테고리를 먼저 가져옵니다.
      const fetchedCategories = await getCategories();
      // 2. 상품 목록을 가져옵니다. (기본값: 전체=0)
      if (fetchedCategories.length > 0) {
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
      // 위치 정보가 있으면 보낼 수 있지만, 현재는 null로 처리 (필요시 userInfo.addr 등을 좌표로 변환 필요)
      const paramLong = null;
      const paramLat = null;

      // categoryId가 없으면 현재 선택된 카테고리 사용, 그래도 없으면 0 (전체)
      const targetCategoryId = categoryId ?? selectedCategory?.id ?? 0;

      // Query String 구성
      const queryParams = new URLSearchParams();
      if (targetCategoryId !== 0) {
        queryParams.append("category_id", String(targetCategoryId));
      }
      if (searchKeyword) {
        queryParams.append("search_keyword", searchKeyword?.trim());
      }
      // 필요한 경우 위도/경도도 query param으로 보낼 수 있음
      // queryParams.append("longitude", ...);

      const url = `${apiUrl}/api/item/get_items?${queryParams.toString()}`;

      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let result: any = await response.json();

      if (response?.ok && result?.success) {
        console.log("상품 가져오기 성공:", result?.data);
        setItems(result.data);
      } else {
        console.log("상품 가져오기 실패:", result?.msg);
      }
    } catch (error: any) {
      console.error("상품 가져오기 에러:", error?.message);
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

        // [수정] 0번째에 ALL 추가
        const allCategory: CategoryType = { id: 0, name: "ALL", order_no: 0 };
        const newList = [allCategory, ..._data];

        setCategoryList(newList);
        setSelectedCategory(newList[0]); // 기본값 선택

        return newList; // ★ 핵심: 데이터를 여기서 바로 리턴해줘야 다음 함수가 씁니다.
      } else {
        alert(`카테고리 가져오기 실패했습니다. ${result?.msg}`);
        return [];
      }
    } catch (error: any) {
      console.error("네트워크 에러:", error?.message);
      return [];
    }
  }

  useFocusEffect(
    useCallback(() => {
      // ★ 3. 키보드 이벤트 리스너 등록
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow", // 키보드가 완전히 올라왔을 때
        () => {
          setKeyboardVisible(true);
        }, // 상태 true
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide", // 키보드가 완전히 내려갔을 때
        () => {
          setKeyboardVisible(false);
        }, // 상태 false
      );
      loadData(); // 실행
      // 컴포넌트가 사라질 때 리스너 제거 (메모리 누수 방지)
      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
        // ★ [핵심] 화면 나갈 때 데이터 강제 초기화
        // 이렇게 하면 뒤로가기 했다가 다시 들어와도 깨끗한 상태가 됩니다.
        setKeyboardVisible(false);
        // 필요하다면 에러 메시지나 포커스 상태도 초기화
        setErrorMsg(null);
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View>
          <Text>{JSON.stringify(userInfo)}</Text>
          <Text>{JSON.stringify(token)}</Text>
        </View>

        {/* Hero Image Section */}
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <LottieView
            source={require("../../assets/lottie/Bunny_Hop.json")}
            style={{ width: 200, height: 200 }}
            autoPlay
            loop
          />
          <Text style={{ fontSize: 24, fontWeight: "bold", marginTop: 10 }}>
            토끼마켓
          </Text>
        </View>

        {/* Search Section */}
        <View style={{ padding: 10, flexDirection: "row" }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              padding: 10,
              marginRight: 10,
            }}
            placeholder="검색어를 입력하세요"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={() => getItems()}
          />
          <TouchableOpacity
            onPress={() => getItems()}
            style={{
              backgroundColor: "#007AFF",
              padding: 10,
              borderRadius: 5,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white" }}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Grid Section */}
        <View style={{ position: "relative", minHeight: 500 }}>
          {/* Background Lottie Layer */}
          <View
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
            pointerEvents="none"
          >
            <LottieView
              source={require("../../assets/lottie/Angry_bird.json")}
              style={{ width: "100%", height: "100%", opacity: 0.5 }}
              autoPlay
              loop
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "bold", margin: 10 }}>
            상품들
          </Text>

          {/* Category Selection UI */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10, paddingHorizontal: 10, flexGrow: 0 }}
            >
              {categoryList.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectCategory(cat)}
                  style={{
                    padding: 10,
                    marginRight: 10,
                    backgroundColor:
                      selectedCategory?.id === cat.id ? "#007AFF" : "#E0E0E0",
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedCategory?.id === cat.id ? "white" : "black",
                    }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                marginBottom: 20,
                backgroundColor: "rgba(255, 255, 255, 0.7)", // 배경을 반투명하게 변경
                borderRadius: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 3,
                overflow: "hidden", // 이미지가 둥근 모서리를 넘치지 않게 함
                flexDirection: "row", // ★ 가로 배치로 변경
                alignItems: "center", // 세로 중앙 정렬
                padding: 10,
              }}
              onPress={() => {
                router.push({
                  pathname: "/(tabs)/Detail",
                  params: { item_id: item.item_id },
                });
              }}
            >
              {/* 이미지 영역 (썸네일) */}
              {item.images && item.images.length > 0 ? (
                <Image
                  source={{ uri: item.images[0].url }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  contentFit="cover"
                  transition={500}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    backgroundColor: "#e0e0e0",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "gray", fontSize: 10 }}>No Image</Text>
                </View>
              )}

              {/* 텍스트 정보 영역 */}
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold" }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "600" }}>
                  {item.price?.toLocaleString()}원
                </Text>
                <Text style={{ color: "gray", marginTop: 4, fontSize: 13 }}>
                  {item.addr}{" "}
                  {item.distance_m ? `(${Math.round(item.distance_m)}m)` : ""}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Product+ Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#FF8C00",
          borderRadius: 30,
          paddingVertical: 15,
          paddingHorizontal: 20,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          flexDirection: "row",
          alignItems: "center",
          zIndex: 999,
        }}
        onPress={() => {
          router.push({
            pathname: "/UploadItem",
            params: { itemId: 0 },
          });
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          상품+
        </Text>
      </TouchableOpacity>

      <Loading visible={loading} />
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
});
