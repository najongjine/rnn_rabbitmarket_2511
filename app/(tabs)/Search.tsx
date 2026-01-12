import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react"; // useMemo 추가
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KakaoPlaceType } from "../types/types";

const { width } = Dimensions.get("window");

export default function Search() {
  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const queryString = useLocalSearchParams();
  const searchKeyword = String(queryString?.searchKeyword ?? "");

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kakaoPlace, setKakaoPlace] = useState<KakaoPlaceType[]>([]);

  // 로딩 상태 (기본값 false)
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>(searchKeyword ?? "");
  const [sortBy, setSortBy] = useState<"distance" | "score">("distance");

  // 정렬 로직
  const sortedKakaoPlace = useMemo(() => {
    const sorted = [...kakaoPlace];
    if (sortBy === "distance") {
      return sorted.sort((a, b) => {
        const distA = Number(a.distance) || Infinity;
        const distB = Number(b.distance) || Infinity;
        return distA - distB;
      });
    } else {
      return sorted.sort((a, b) => {
        const scoreA = Number(a.predicted_recommendation_score) || 0;
        const scoreB = Number(b.predicted_recommendation_score) || 0;
        return scoreB - scoreA;
      });
    }
  }, [kakaoPlace, sortBy]);

  async function getCurrentLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("위치 권한이 거부되었습니다.");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);

    if (searchKeyword && location) {
      await getHospital(searchKeyword, location);
    }
  }

  async function getHospital(
    query: string = "",
    location: Location.LocationObject | null = null
  ) {
    if (!query) return;
    setLoading(true); // 로딩 시작
    try {
      const params = new URLSearchParams();
      params.append("query", String(query));
      params.append("x", String(location?.coords?.longitude ?? ""));
      params.append("y", String(location?.coords?.latitude ?? ""));

      const response = await fetch(`${apiUrl}/api/hospital?${params}`, {
        method: "GET",
        headers: {},
      });
      let _data = await response.json();
      setKakaoPlace(_data?.data);
    } catch (e: any) {
      console.error(e?.message ?? "");
    } finally {
      setLoading(false); // 로딩 종료
    }
  }

  async function onSearch() {
    getHospital(searchText, location);
  }

  useFocusEffect(
    useCallback(() => {
      getCurrentLocation();
    }, [searchKeyword])
  );

  return (
    <View style={styles.container}>
      {/* 1. 상단 검색바 영역 */}
      <View style={styles.searchHeader}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="병원, 약국 검색"
            placeholderTextColor="#AAA"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 정렬 필터 버튼 영역 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            sortBy === "distance" && styles.filterButtonActive,
          ]}
          onPress={() => setSortBy("distance")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              sortBy === "distance" && styles.filterTextActive,
            ]}
          >
            거리순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            sortBy === "score" && styles.filterButtonActive,
          ]}
          onPress={() => setSortBy("score")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              sortBy === "score" && styles.filterTextActive,
            ]}
          >
            추천도순
          </Text>
        </TouchableOpacity>
      </View>

      {/* 에러 메시지 표시 */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* 2. 결과 리스트 영역 (로딩 처리 변경) */}
      {loading ? (
        // [변경] 로딩 중일 때 보여줄 전체 화면 뷰
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>
            데이터를 분석하고 있습니다...{"\n"}잠시만 기다려주세요.
          </Text>
        </View>
      ) : (
        // 로딩이 아닐 때 리스트 표시
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 결과가 없을 때 안내 문구 */}
          {sortedKakaoPlace.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={48} color="#DDD" />
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptySubText}>
                다른 키워드로 검색해보세요.
              </Text>
            </View>
          )}

          {/* 리스트 아이템 */}
          {sortedKakaoPlace?.length > 0 &&
            sortedKakaoPlace.map((item, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  style={styles.card}
                  onPress={() => {
                    router.push({
                      pathname: "/Detail",
                      params: {
                        kakaoPlace: JSON.stringify(item),
                        locationData: JSON.stringify(location),
                        myLat: location?.coords?.latitude ?? 0,
                        myLng: location?.coords?.longitude ?? 0,
                      },
                    });
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {item?.place_name}
                    </Text>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>
                        {item?.distance ? `${item.distance}m` : "거리정보 없음"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: "#444" }}>
                      평점:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {item?.rating ?? 0}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: "#444", marginTop: 2 }}>
                      혼잡도: {(item?.congestion_level ?? 0) <= 0 && "손님적음"}
                      {item?.congestion_level == 1 && "손님보통"}
                      {(item?.congestion_level ?? 0) >= 2 && "손님많음"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#444", marginTop: 2 }}>
                      추천점수:{" "}
                      <Text style={{ fontWeight: "bold", color: "#1E88E5" }}>
                        {(item?.predicted_recommendation_score ?? 0).toFixed(2)}
                      </Text>
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { marginTop: 10 }]}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#666"
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item?.road_address_name ||
                        item?.address_name ||
                        "주소 정보 없음"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Search Header Styles
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  searchButton: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // [추가] Filter Styles (정렬 버튼)
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterButton: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  filterButtonActive: {
    borderColor: "#1E88E5",
    backgroundColor: "#1E88E5",
  },
  filterText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // Error & Empty State
  errorContainer: {
    padding: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  loadingContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#AAA",
    marginTop: 8,
  },

  // List Styles
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  distanceBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: {
    color: "#1E88E5",
    fontSize: 12,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  // [추가] 리스트 영역을 꽉 채우는 로딩 스타일
  fullLoadingContainer: {
    flex: 1, // 남은 공간을 전부 차지
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
