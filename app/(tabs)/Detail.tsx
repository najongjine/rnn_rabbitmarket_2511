import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { ItemDetailType } from "../types/types";

const { width } = Dimensions.get("window");

export default function Detail() {
  const router = useRouter();
  const { userInfo } = useAuth();

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const queryString = useLocalSearchParams();
  const item_id = Number(queryString?.item_id || 0);

  const [item, setItem] = useState<ItemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 상품 정보 가져오기
  useEffect(() => {
    if (!item_id) {
      setErrorMsg("유효하지 않은 상품 ID입니다.");
      setLoading(false);
      return;
    }

    const fetchItemDetail = async () => {
      try {
        setLoading(true);
        // GET /api/item/get_item_by_id?item_id=13
        const response = await fetch(
          `${apiUrl}/api/item/get_item_by_id?item_id=${item_id}`,
        );

        if (!response.ok) {
          console.error(`!에러 ${response.statusText}`);
          alert(`!!에러 ${response.statusText}`);
          setErrorMsg(`!!에러 ${response.statusText}`);
          return;
        }

        const data = await response?.json();
        console.log("data", data);
        if (!data?.success) {
          console.error(`!서버 에러 ${data?.msg}`);
          alert(`!서버 에러 ${data?.msg}`);
          setErrorMsg(`!서버 에러 ${data?.msg}`);
          return;
        }
        // 실제 API 응답 구조에 따라 data 혹은 data.result 등으로 수정 필요할 수 있음
        setItem(data?.data);
      } catch (err: any) {
        console.error(`!에러 ${err?.message}`);
        alert(`!에러 ${err?.message}`);
        setErrorMsg(`!에러 ${err?.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetail();
  }, [item_id, apiUrl]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  if (errorMsg || !item) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {errorMsg || "상품 정보가 없습니다."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 가격 포맷팅 (예: 1,000원)
  const formattedPrice = item.price?.toLocaleString() + "원";
  const firstImage =
    item.images && item.images.length > 0 ? item.images[0].url : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 영역 */}
        <View style={styles.imageContainer}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={48} color="#ccc" />
              <Text style={styles.noImageText}>이미지 없음</Text>
            </View>
          )}
        </View>

        {/* 상세 정보 영역 */}
        <View style={styles.infoSection}>
          <View style={styles.userInfoRow}>
            {/* 유저 프로필 이미지 등은 없으므로 기본 아이콘이나 이름만 표시 */}
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.username}>판매자 (ID: {item.user_id})</Text>
              <Text style={styles.userAddr}>
                {item.user_addr || "위치 정보 없음"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>
            {item.category_name || "카테고리 없음"}
          </Text>
          <Text style={styles.price}>{formattedPrice}</Text>

          <View style={styles.divider} />

          <Text style={styles.contentLabel}>상품 설명</Text>
          <Text style={styles.content}>{item.content}</Text>

          <View style={styles.divider} />

          {/* 추가 정보 (위치 등) */}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{item.addr || "거래 장소 미정"}</Text>
          </View>
          <View style={[styles.metaRow, { marginTop: 4 }]}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : ""}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 구매/채팅 버튼 영역 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.priceContainer}>
          <Text style={styles.bottomPrice}>{formattedPrice}</Text>
        </View>
        {userInfo?.id === item.user_id ? (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              router.push({
                pathname: "/UploadItem",
                params: { itemId: item.item_id },
              });
            }}
          >
            <Text style={styles.chatButtonText}>수정하기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.chatButtonText}>거래예약</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80, // 하단 바 높이만큼 여백
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#333",
  },

  // 이미지
  imageContainer: {
    width: "100%",
    height: width, // 1:1 비율
    backgroundColor: "#f0f0f0",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#999",
    marginTop: 8,
  },

  // 정보 섹션
  infoSection: {
    padding: 20,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userAddr: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  content: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },

  // 하단 바
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  heartButton: {
    padding: 10,
    marginRight: 10,
  },
  priceContainer: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  chatButton: {
    backgroundColor: "#FF8C00", // 당근마켓 주황색 계열
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
