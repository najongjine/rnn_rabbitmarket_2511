import { useFocusEffect, useRouter } from "expo-router";
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
import { useAuth } from "../context/AuthContext";
import { CategoryType, ItemDetailType } from "../types/types";

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

  // ★ 데이터 로딩 순서 제어 함수
  async function loadData() {
    // 1. 카테고리를 먼저 가져옵니다.
    const fetchedCategories = await getCategories();
    // 2. 상품 목록을 가져옵니다. (기본값: 전체=0)
    if (fetchedCategories.length > 0) {
      await getItems(fetchedCategories[0].id);
    } else {
      await getItems(0);
    }
  }

  const handleSelectCategory = async (category: CategoryType) => {
    setSelectedCategory(category);
    await getItems(category.id);
  };

  async function getItems(categoryId?: number) {
    try {
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

      const response = await fetch(url, {
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
    }
  }

  async function getCategories(): Promise<CategoryType[]> {
    try {
      const response = await fetch(`${apiUrl}/api/item/get_categories`, {
        method: "GET",
      });
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
        <View>
          <View />
          <Text>토끼마켓</Text>
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
        <View>
          <Text style={{ fontSize: 18, fontWeight: "bold", margin: 10 }}>
            상품들
          </Text>

          {/* Category Selection UI */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10, paddingHorizontal: 10 }}
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
                    color: selectedCategory?.id === cat.id ? "white" : "black",
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {items.map((item, index) => (
            <View
              key={index}
              style={{
                marginBottom: 20,
                padding: 10,
                backgroundColor: "white",
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {item.title}
              </Text>
              <Text>{item.price?.toLocaleString()}원</Text>
              <Text style={{ color: "gray" }}>
                {item.addr}{" "}
                {item.distance_m ? `(${Math.round(item.distance_m)}m)` : ""}
              </Text>
            </View>
          ))}
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
});
