import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Button,
  Dimensions,
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

  useFocusEffect(useCallback(() => {}, []));

  return (
    <View>
      <ScrollView>
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
          <Button title="상품등록" onPress={() => {}} />
        </View>
      </ScrollView>
    </View>
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
});
