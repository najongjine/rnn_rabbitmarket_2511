import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Button,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>({});
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");

  useFocusEffect(useCallback(() => {}, []));

  return (
    <View>
      <ScrollView>
        <View>
          <Text>싱품업로드</Text>
        </View>
        <View>
          <Text>카테고리선택:</Text>
          {categoryList.map((item, index) => (
            <View>
              <TouchableOpacity
                key={item?.id}
                onPress={() => {
                  setSelectedCategory(item);
                }}
              >
                <Text>{item?.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
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

const styles = StyleSheet.create({});
