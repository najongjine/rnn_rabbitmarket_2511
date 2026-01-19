import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { CategoryType } from "../types/types";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const router = useRouter();
  // 유저정보 관련 기능
  const { userInfo, token, signOut } = useAuth();
  // 유저정보 관련 기능 END
  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(
    categoryList[0]
  );

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ★ 데이터 로딩 순서 제어 함수
  async function loadData() {
    // 1. 카테고리를 먼저 가져옵니다.
    const fetchedCategories = await getCategories();

  }

  async function getCategories(): Promise<CategoryType[]> {
    try {
      const response = await fetch(`${apiUrl}/api/item/get_categories`, {
        method: "GET",
      });
      let result: any = await response.json();

      if (response?.ok && result?.success) {
        let _data: CategoryType[] = result?.data;
        setCategoryList(_data);
        return _data; // ★ 핵심: 데이터를 여기서 바로 리턴해줘야 다음 함수가 씁니다.
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
        } // 상태 true
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide", // 키보드가 완전히 내려갔을 때
        () => {
          setKeyboardVisible(false);
        } // 상태 false
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
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View >
          <Text >{JSON.stringify(userInfo)}</Text>
          <Text >{JSON.stringify(token)}</Text>
        </View>

        {/* Hero Image Section */}
        <View >

          <View />
          <Text >토끼마켓</Text>
        </View>

        {/* Categories Grid Section */}
        <View >
          <Text >상품들</Text>

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
