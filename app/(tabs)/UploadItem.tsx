import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Button,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useAuth } from "../context/AuthContext";
import { CategoryType } from "../types/types";

const { width } = Dimensions.get("window");

export default function UploadItem() {
  const router = useRouter();
  const { userInfo, token, signOut } = useAuth();

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const kakaoRestapiKey = process.env.EXPO_PUBLIC_KAKAO_RESTAPI_KEY;
  const queryString = useLocalSearchParams();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // ★ 2. 키보드가 보이는지 여부를 저장할 state 추가
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [categoryList, setCategoryList] = useState<CategoryType[]>([
    {
      id: 1,
      name: "기타...",
      order_no: 1,
    },
    { id: 2, name: "반려동물", order_no: 2 },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(
    categoryList[0]
  );
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");
  const [isFocus, setIsFocus] = useState(false);

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

      // 컴포넌트가 사라질 때 리스너 제거 (메모리 누수 방지)
      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    }, [])
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      {/* 1. 부모 스크롤뷰에 nestedScrollEnabled 추가 */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }} // 아까 말한 여백 꼭 유지하세요
        nestedScrollEnabled={true} // ★ 이거 추가
        keyboardDismissMode="on-drag" // 스크롤 시 키보드 내리기 (추천)
      >
        <View>
          <Text>싱품업로드</Text>
        </View>
        <View>
          <Text>카테고리선택:</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: "blue" }]} // 포커스 시 스타일 변경
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={categoryList}
            search // 검색 기능 활성화 (필요 없으면 제거 가능)
            maxHeight={300} // ★ 일정 크기 넘어가면 스크롤 되는 높이 설정
            labelField="name" // ★ 화면에 보여질 필드명 (item.name)
            valueField="id" // ★ 실제 값으로 쓸 필드명 (item.id)
            placeholder={!isFocus ? "카테고리를 선택하세요" : "..."}
            searchPlaceholder="검색..."
            value={selectedCategory?.id} // 현재 선택된 값 (ID 기준)
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={(item) => {
              setSelectedCategory(item); // 선택된 아이템 전체를 state에 저장
              setIsFocus(false);
            }}
          />
        </View>
        <View>
          <Text>제목:</Text>
          <TextInput
            value={title}
            onChangeText={(e) => {
              setTitle(e);
            }}
          />
        </View>
        <View>
          <Text>가격:</Text>
          <TextInput
            value={price}
            keyboardType="number-pad"
            onChangeText={(e) => {
              // 2. 숫자(0-9)가 아닌 모든 문자는 빈 문자열로 치환
              const numericValue = e?.replace(/[^0-9]/g, "");
              setPrice(numericValue);
            }}
          />
        </View>

        <View>
          <Text>내용:</Text>
          <TextInput
            style={styles.textArea} // ★ 스타일 연결
            value={content}
            multiline={true}
            placeholder="내요을 입력해 주세요"
            scrollEnabled={true}
            onChangeText={(e) => {
              setContent(e);
            }}
          />
        </View>

        <View>
          <Button title="상품등록" onPress={() => {}} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    flex: 1, // 전체 화면 사용 시
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "white", // 배경색 지정
  },
  placeholderStyle: {
    fontSize: 16,
    color: "gray",
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  textArea: {
    height: 250, // ★ 중요: 높이를 고정해야 키보드 위로 전체가 올라옵니다
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top", // 안드로이드에서 글자 위쪽 정렬
    marginTop: 10,
  },
});
