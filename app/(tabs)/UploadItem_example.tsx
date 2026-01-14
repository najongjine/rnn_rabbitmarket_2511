import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Button,
  GestureResponderEvent,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UploadItem() {
  // --- 상태 관리 (Typescript Generics 활용) ---
  const [category, setCategory] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // 이미지 URI들을 담을 배열이므로 string[] 타입을 명시
  const [images, setImages] = useState<string[]>([]);

  const MAX_IMAGES = 5;
  const CATEGORIES: string[] = [
    "디지털기기",
    "생활가전",
    "가구/인테리어",
    "유아동",
    "생활/가공식품",
  ];

  // --- 1. 사진 선택 로직 ---
  const pickImages = async (): Promise<void> => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("알림", `최대 사진은 ${MAX_IMAGES}개 까지만 됩니다.`);
      return;
    }

    // ImagePicker 결과 타입: ImagePickerResult
    let result: ImagePicker.ImagePickerResult =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // TS에서는 이늄 대신 문자열 배열도 허용되지만, 최신 버전 권장사항 따름
        allowsMultipleSelection: true,
        quality: 1,
      });

    if (!result.canceled) {
      // result.assets는 ImagePickerAsset[] 타입입니다.
      const selectedAssets: ImagePicker.ImagePickerAsset[] = result.assets;
      const currentCount: number = images.length;
      const remainingSlots: number = MAX_IMAGES - currentCount;

      if (selectedAssets.length > remainingSlots) {
        const allowedImages: string[] = selectedAssets
          .slice(0, remainingSlots)
          .map((asset) => asset.uri);

        setImages((prev) => [...prev, ...allowedImages]);

        Alert.alert(
          "알림",
          `최대 사진은 ${MAX_IMAGES}개 까지만 됩니다.\n초과된 사진은 제외되었습니다.`
        );
      } else {
        const newImages: string[] = selectedAssets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
      }
    }
  };

  // --- 2. 사진 삭제 로직 ---
  const removeImage = (indexToRemove: number): void => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      {/* === 섹션 1: 사진 업로드 === */}
      <Text>
        사진 등록 ({images.length}/{MAX_IMAGES})
      </Text>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}
      >
        {/* 사진 추가 버튼 */}
        <TouchableOpacity
          onPress={pickImages}
          style={{
            marginRight: 10,
            borderWidth: 1,
            padding: 10,
            justifyContent: "center",
          }}
        >
          <Text>+ 사진추가</Text>
        </TouchableOpacity>

        {/* 선택된 사진 미리보기 & 삭제 */}
        {images.map((uri: string, index: number) => (
          <View key={index} style={{ marginRight: 10, position: "relative" }}>
            <Image
              source={{ uri }}
              style={{ width: 60, height: 60, backgroundColor: "#ddd" }}
            />
            <TouchableOpacity
              onPress={() => removeImage(index)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: "red",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}> X </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: "#ccc", marginBottom: 20 }} />

      {/* === 섹션 2: 카테고리 === */}
      <Text>카테고리 선택</Text>
      <TouchableOpacity
        onPress={() => setIsCategoryOpen(!isCategoryOpen)}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      >
        <Text>{category || "카테고리를 선택해주세요 ▼"}</Text>
      </TouchableOpacity>

      {isCategoryOpen && (
        <View style={{ borderWidth: 1, marginBottom: 20 }}>
          {CATEGORIES.map((item: string) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setCategory(item);
                setIsCategoryOpen(false);
              }}
              style={{ padding: 10, borderBottomWidth: 1, borderColor: "#eee" }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* === 섹션 3: 텍스트 입력 === */}
      <Text>제목</Text>
      <TextInput
        placeholder="글 제목"
        value={title}
        onChangeText={setTitle} // (text: string) => void 타입 자동 추론됨
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Text>가격</Text>
      <TextInput
        placeholder="가격 (원)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Text>자세한 설명</Text>
      <TextInput
        placeholder="게시글 내용을 작성해주세요."
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={5}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 30,
          height: 100,
          textAlignVertical: "top",
        }}
      />

      <Button
        title="작성 완료"
        onPress={(e: GestureResponderEvent) =>
          Alert.alert(
            "확인",
            `제목: ${title}\n가격: ${price}\n사진: ${images.length}장`
          )
        }
      />
    </ScrollView>
  );
}
