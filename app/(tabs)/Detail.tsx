import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Loading from "../component/Loading";
import { useAuth } from "../context/AuthContext";
import { ItemDetailType } from "../types/types";
import { fetchWithTimeout } from "../utils/api";

export default function Detail() {
  const router = useRouter();
  const { userInfo, token } = useAuth();
  const { width } = useWindowDimensions();

  // On Desktop/Web, width can be huge (e.g. 1920).
  // We clamp the image height to ensure content is visible.
  // Mobile: width * 0.75 (300~400px). Desktop: max 500px.
  const IMAGE_HEIGHT = Math.min(width * 0.75, 450);

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const queryString = useLocalSearchParams();
  const item_id = Number(queryString?.item_id || 0);

  const [item, setItem] = useState<ItemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // 상품 정보 가져오기
  useFocusEffect(
    useCallback(() => {
      if (!item_id) {
        setErrorMsg("유효하지 않은 상품 ID입니다.");
        setLoading(false);
        return;
      }

      const fetchItemDetail = async () => {
        try {
          setLoading(true);
          const response = await fetchWithTimeout(
            `${apiUrl}/api/item/get_item_by_id?item_id=${item_id}`,
          );

          if (!response.ok) {
            throw new Error(response.statusText);
          }

          const data = await response?.json();
          if (!data?.success) {
            throw new Error(data?.msg || "서버 에러");
          }
          console.log("data", data?.data);
          setItem(data?.data);
        } catch (err: any) {
          console.error(`Error: ${err?.message}`);
          setErrorMsg(err?.message || "상품 정보를 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };

      fetchItemDetail();
    }, [item_id, apiUrl]),
  );

  const handleScroll = (index: number) => {
    if (!item?.images || item.images.length === 0) return;
    if (index < 0 || index >= item.images.length) return;

    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const onMomentumScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteModalVisible(false); // Close modal

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("id", item_id.toString());

      const response = await fetchWithTimeout(
        `${apiUrl}/api/item/delete_item_by_id`,
        {
          method: "POST",
          headers: {
            // "Content-Type" should not be set manually for FormData; fetch handles it.
            Authorization: `${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        alert(`삭제 실패 : ${response?.statusText}`);
        return;
      }

      const data = await response.json();
      if (data?.success) {
        // Successfully deleted
        router.back();
      } else {
        alert(`삭제 실패 : ${data?.msg}`);
        return;
      }
    } catch (err: any) {
      alert(`삭제 실패 : ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading visible={true} />
      </View>
    );
  }

  if (errorMsg || !item) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
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

  const formattedPrice = item.price
    ? `${item.price.toLocaleString()}원`
    : "가격 미정";
  const hasImages = item.images && item.images.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel Section */}
        <View
          style={{
            position: "relative",
            width: width,
            height: IMAGE_HEIGHT,
            backgroundColor: "#212529",
          }}
        >
          {hasImages ? (
            <>
              <FlatList
                ref={flatListRef}
                data={item.images}
                keyExtractor={(img, idx) => `${img.img_id}-${idx}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise((resolve) =>
                    setTimeout(resolve, 500),
                  );
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  });
                }}
                renderItem={({ item: img }) => (
                  <Image
                    source={{ uri: img.url }}
                    style={{
                      width: width,
                      height: IMAGE_HEIGHT,
                    }}
                    resizeMode="contain"
                  />
                )}
              />

              {/* Pagination Counter */}
              <View style={styles.paginationBadge}>
                <Text style={styles.paginationText}>
                  {activeIndex + 1} / {item.images!.length}
                </Text>
              </View>

              {/* Navigation Arrows */}
              {item.images!.length > 1 && (
                <>
                  {activeIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.arrowButton, styles.leftArrow]}
                      onPress={() => handleScroll(activeIndex - 1)}
                    >
                      <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {activeIndex < item.images!.length - 1 && (
                    <TouchableOpacity
                      style={[styles.arrowButton, styles.rightArrow]}
                      onPress={() => handleScroll(activeIndex + 1)}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          ) : (
            <View
              style={{
                width: width,
                height: IMAGE_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
              }}
            >
              <Ionicons name="image-outline" size={64} color="#ddd" />
              <Text style={styles.noImageText}>이미지가 없습니다</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#ccc" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.sellerName}>판매자 (ID: {item.user_id})</Text>
              <Text style={styles.locationText}>
                {item.user_addr || "위치 정보 없음"}
              </Text>
            </View>
          </View>
          {/* 매너온도 같은 것을 여기에 추가하면 더 프리미엄 해보임 */}
        </View>

        <View style={styles.divider} />

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>
            {item.category_name || "기타"} •{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : ""}
          </Text>

          <Text style={styles.description}>{item.content}</Text>

          <View style={styles.metaInfo}>
            <Ionicons name="location-sharp" size={16} color="#868e96" />
            <Text style={styles.metaText}>{item.addr || "거래 장소 미정"}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.wishButton}>
            <Ionicons name="heart-outline" size={24} color="#868e96" />
            {/* <Text style={styles.wishCount}>0</Text> 숫자 추가 가능 */}
          </TouchableOpacity>

          <View style={styles.verticalLine} />

          <View style={styles.priceArea}>
            <Text style={styles.priceText}>{formattedPrice}</Text>
          </View>

          {userInfo?.id === item.user_id ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => {
                  router.push({
                    pathname: "/UploadItem",
                    params: { itemId: item.item_id },
                  });
                }}
              >
                <Text style={[styles.actionButtonText, styles.editButtonText]}>
                  수정
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.actionButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>채팅하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>게시글 삭제</Text>
            <Text style={styles.modalMessage}>
              정말로 이 게시글을 삭제하시겠습니까?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#666",
  },
  backButton: {
    backgroundColor: "#f1f3f5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#495057",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Bottom bar height clearance
  },

  // Carousel Styles
  // Moved to inline styles or dynamic styles due to useWindowDimensions usage

  noImageText: {
    marginTop: 10,
    color: "#adb5bd",
    fontSize: 16,
  },
  headerBackButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  paginationBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  paginationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    marginTop: -20, // half of height
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  leftArrow: {
    left: 15,
  },
  rightArrow: {
    right: 15,
  },

  // Profile Section
  profileSection: {
    padding: 20,
    backgroundColor: "#fff",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileInfo: {
    justifyContent: "center",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: "#868e96",
  },

  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },

  // Content Section
  contentSection: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
    lineHeight: 30,
  },
  category: {
    fontSize: 13,
    color: "#868e96",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: "#343a40",
    marginBottom: 30,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
    marginLeft: 6,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    elevation: 10, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16, // 높이감 확보
  },
  wishButton: {
    padding: 4,
  },
  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: "#dee2e6",
    marginHorizontal: 16,
  },
  priceArea: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212529",
  },
  actionButton: {
    backgroundColor: "#FF6F0F", // Carrot Market Orange
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: "#f1f3f5",
  },
  editButtonText: {
    color: "#212529",
  },
  deleteButton: {
    backgroundColor: "#fa5252",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#212529",
  },
  modalMessage: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f3f5",
  },
  confirmButton: {
    backgroundColor: "#fa5252",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
