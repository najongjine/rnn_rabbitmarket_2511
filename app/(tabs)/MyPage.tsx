import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
// 👇 주소 검색 코드 복구
import Postcode from "@actbase/react-daum-postcode";

// ---------------------- Types ----------------------
interface ItemImage {
  id: number;
  img_url: string;
}

interface UserItem {
  id: number;
  title: string;
  price: number;
  content: string;
  status: "sale" | "sold" | "reserved" | string;
  created_at: string;
  updated_at: string;
  item_images?: ItemImage[];
}

interface UserProfileData {
  id: number;
  nickname: string;
  username: string;
  phone_number?: string;
  profile_img?: string;
  addr?: string;
  long?: number;
  lat?: number;
  items: UserItem[];
}

interface ApiResponse {
  success: boolean;
  data: UserProfileData;
  msg?: string;
}

// 👇 좌표 변환 관련 타입 복구
interface KakaoGeocodeResponse {
  documents: Array<{
    address: { x: string; y: string };
  }>;
}

const { width } = Dimensions.get("window");
// 👇 환경변수
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_RESTAPI_KEY;

export default function MyPage() {
  const router = useRouter();
  const { token, signOut, signIn } = useAuth();

  // 데이터 상태
  const [userInfoData, setUserInfoData] = useState<UserProfileData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 👇 주소 검색 모달 상태 복구
  const [isModalVisible, setIsModalVisible] = useState(false);

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;

  // ---------------------- API Call: Profile ----------------------
  const fetchUserProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const authHeader = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;

      const response = await fetch(`${apiUrl}/api/user/get_user_by_token`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      const result = (await response.json()) as ApiResponse;

      if (response.ok && result.success) {
        setUserInfoData(result.data);
      } else {
        console.error("Failed to fetch user profile:", result.msg);
      }
    } catch (error) {
      console.error("Network error fetching user profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(tabs)/Login");
  };

  // ---------------------- Address Logic (Restored) ----------------------

  // 주소 선택 핸들러
  const handleAddressSelected = async (data: any) => {
    setIsModalVisible(false);
    const newAddr = data.address;

    // 1. 좌표 구하기
    const coords = await getGeoCode(newAddr);

    // 2. 서버 통신 (API 호출)
    if (coords) {
      await updateUserAddress(newAddr, coords);
    }
  };

  // 좌표 및 주소 업데이트 함수
  const updateUserAddress = async (
    newAddr: string,
    coords: { latitude: number; longitude: number },
  ) => {
    try {
      // 1. FormData 생성
      const formData = new FormData();
      formData.append("addr", newAddr); // 혹시 몰라 주소도 보냄
      formData.append("long", String(coords.longitude));
      formData.append("lat", String(coords.latitude));

      // Authorization 헤더 준비
      const authHeader =
        token && token.startsWith("Bearer ") ? token : `Bearer ${token}`;

      // 2. API 호출
      const response = await fetch(`${apiUrl}/api/user/update_user_geo`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          // FormData는 Content-Type 자동 설정
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 3. 성공 시 처리
        console.log("주소/좌표 업데이트 성공:", result.data);

        // 서버에서 갱신된 정보와 토큰을 내려준다고 가정 (명세 기반)
        const updatedUser = result?.data?.userInfo || {};
        const newToken = result?.data?.token || "";

        // ★ 중요: 서버 쿼리에 addr 업데이트가 빠져있다면 반환된 user의 주소가 옛날 것일 수 있음.
        // 하지만 여기서는 서버가 RETURNING * 로 반환한 user 객체(items 없음)가 옴.
        // 기존 items를 유지하면서 user 정보만 갱신해야 함.

        // 4. 앱 전체 상태(Context) 및 로컬 상태 갱신
        if (signIn) {
          // AuthContext에는 items가 필요 없으므로 그대로 저장
          await signIn(updatedUser, newToken);
        }

        // 5. 현재 화면 데이터 갱신 (기존 items 유지)
        setUserInfoData((prev) => {
          if (!prev) return updatedUser;
          return {
            ...prev,
            ...updatedUser,
            items: prev.items || [], // 기존 아이템 유지
            addr: newAddr, // 주소 강제 보정
          };
        });

        alert("주소가 변경되었습니다.");
      } else {
        alert(`주소 업데이트 실패: ${result.msg}`);
      }
    } catch (error: any) {
      console.error("Update Address Error:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  // 좌표 변환 함수
  const getGeoCode = async (queryAddress: string) => {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(queryAddress)}`;
      const response = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      });
      const result = (await response.json()) as KakaoGeocodeResponse;

      if (result.documents && result.documents.length > 0) {
        const { x, y } = result.documents[0].address;
        return { latitude: parseFloat(y), longitude: parseFloat(x) };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // ---------------------- Render Helpers ----------------------

  const renderItem = ({ item }: { item: UserItem }) => {
    const thumbUrl =
      item.item_images && item.item_images.length > 0
        ? item.item_images[0].img_url
        : "https://via.placeholder.com/100";

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: thumbUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemPrice}>{item.price.toLocaleString()}원</Text>
          <View style={styles.itemStatusContainer}>
            <Text
              style={[
                styles.itemStatus,
                item.status === "sale" ? styles.statusSale : styles.statusSold,
              ]}
            >
              {item.status === "sale" ? "판매중" : item.status}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !userInfoData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>로그인이 필요합니다.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/(tabs)/Login")}
        >
          <Text style={styles.loginBtnText}>로그인 하러가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userInfoData?.items || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              <View style={styles.profileRow}>
                <Image
                  source={{
                    uri:
                      userInfoData?.profile_img ||
                      "https://via.placeholder.com/100",
                  }}
                  style={styles.profileImage}
                />
                <View style={styles.profileTextInfo}>
                  <Text style={styles.nickname}>
                    {userInfoData?.nickname || "닉네임 없음"}
                  </Text>
                  <Text style={styles.username}>@{userInfoData?.username}</Text>

                  {/* 👇 주소 표시 및 수정 버튼 */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.address}>
                      {userInfoData?.addr || "주소를 등록해주세요"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(true)}
                      style={styles.addrEditBtn}
                    >
                      <Text style={styles.addrEditText}>주소 수정</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>로그아웃</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                판매 내역 ({userInfoData?.items?.length || 0})
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 상품이 없습니다.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* 👇 주소 검색 모달 */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={{ flex: 1, paddingTop: 50 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>주소 검색</Text>
            <Button
              title="닫기"
              onPress={() => setIsModalVisible(false)}
              color="red"
            />
          </View>

          <Postcode
            style={{ width: "100%", flex: 1 }}
            jsOptions={{ animation: true }}
            onSelected={handleAddressSelected}
            onError={(err: any) => console.warn(err)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
  },
  profileTextInfo: {
    marginLeft: 20,
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  username: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#888",
  },
  addrEditBtn: {
    marginTop: 4,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addrEditText: {
    fontSize: 12,
    color: "#555",
  },
  logoutButton: {
    marginTop: 15,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 6,
  },
  logoutText: {
    fontSize: 12,
    color: "#666",
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // List Styles
  sectionTitleContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fafafa",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    marginLeft: 15,
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    color: "#333",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
    color: "#000",
  },
  itemStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  itemStatus: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  statusSale: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  statusSold: {
    backgroundColor: "#ffebee",
    color: "#d32f2f",
  },
  itemDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: 14,
  },

  // Modal Styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
