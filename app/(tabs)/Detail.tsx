import { Ionicons } from "@expo/vector-icons"; // 아이콘 사용
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import URLModal from "../component/URLModal";
import { KakaoPlaceType } from "../types/types";

export default function Detail() {
  const queryString = useLocalSearchParams();
  // 데이터 파싱 시 에러 방지를 위해 try-catch 혹은 안전한 파싱 처리가 좋지만,
  // 기존 로직을 유지하며 디자인에 집중하겠습니다.
  const kakaoPlace = queryString?.kakaoPlace
    ? (JSON.parse(String(queryString.kakaoPlace)) as KakaoPlaceType)
    : null;

  /** 모달창 열기 관련 변수들 */
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리

  const myLat = queryString?.myLat ?? 0; // 예시 위도
  const myLng = queryString?.myLng ?? 0; // 예시 경도
  // 이동 수단 선택 (car: 자동차, public: 대중교통, walk: 도보)
  const transportMode = "walk";
  const routeUrl =
    kakaoPlace && myLat && myLng
      ? `https://map.kakao.com/link/by/${transportMode}/내위치,${myLat},${myLng}/${
          kakaoPlace?.place_name ?? "도착지"
        },${kakaoPlace.y},${kakaoPlace.x}`
      : "https://map.kakao.com";
  /** 모달창 열기 관련 변수들 END */

  // 데이터가 없을 경우 예외 처리 화면
  if (!kakaoPlace) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>병원 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  // 전화 걸기 기능
  const handleCall = () => {
    if (kakaoPlace.phone) {
      Linking.openURL(`tel:${kakaoPlace.phone}`);
    }
  };

  // 웹사이트 이동 기능
  const handleOpenWeb = () => {
    if (kakaoPlace.place_url) {
      Linking.openURL(kakaoPlace.place_url);
    }
  };

  return (
    // 모달창 보이게 하는 최상단 View
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text>{routeUrl}</Text>
        </View>
        {/* 1. 헤더 섹션: 병원 이름과 거리 */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{kakaoPlace.place_name}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {kakaoPlace.distance
                  ? `${kakaoPlace.distance}m`
                  : "거리 정보 없음"}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. 메인 액션 버튼 (전화걸기 / 웹사이트) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callButtonText}>전화 걸기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.webButton]}
            onPress={handleOpenWeb}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={20} color="#333" />
            <Text style={styles.webButtonText}>홈페이지</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 상세 정보 리스트 섹션 */}
        <View style={styles.infoSection}>
          {/* 주소 */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={22} color="#666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>주소</Text>
              <Text style={styles.infoValue}>{kakaoPlace.address_name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 전화번호 (텍스트 뷰) */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={22} color="#666" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>전화번호</Text>
              <Text style={styles.infoValue}>
                {kakaoPlace.phone || "정보 없음"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 홈페이지 (텍스트 뷰) */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#666"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>상세 정보</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {kakaoPlace.place_url || "정보 없음"}
              </Text>
            </View>
          </View>
        </View>
        <View>
          <Button
            title="지도 모달창 열기"
            onPress={() => {
              setIsModalOpen(true);
            }}
          />
        </View>
      </ScrollView>

      {/* 분리된 URL 모달 컴포넌트 사용 */}
      <URLModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        url={routeUrl}
        title={kakaoPlace.place_name}
      />
      {/* 분리된 URL 모달 컴포넌트 사용*/}
    </View> // 모달창 보이게 하는 최상단 View END
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // 아주 연한 회색 배경 (눈이 편안함)
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#666",
    fontSize: 16,
  },

  // 헤더 스타일
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: "row",
  },
  badge: {
    backgroundColor: "#EBF5FF", // 연한 파란색 뱃지
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#2563EB", // 파란색 텍스트
    fontSize: 13,
    fontWeight: "600",
  },

  // 액션 버튼 스타일
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    // 그림자 효과 (Android + iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  callButton: {
    backgroundColor: "#2563EB", // 메인 브랜드 컬러 (신뢰감을 주는 블루)
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  webButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },

  // 정보 섹션 스타일
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    // 카드 형태의 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start", // 텍스트가 길어질 경우를 대비해 상단 정렬
    paddingVertical: 4,
  },
  iconContainer: {
    width: 24,
    marginRight: 16,
    marginTop: 2, // 아이콘 위치 미세 조정
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF", // 연한 회색 라벨
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1F2937", // 짙은 회색 본문
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6", // 아주 옅은 구분선
    marginVertical: 16,
  },
});
