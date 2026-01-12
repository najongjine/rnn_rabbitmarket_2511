import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function WebViewTest() {
  const url =
    Platform.OS === "web" ? "https://www.naver.com" : "https://m.naver.com";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {Platform.OS === "web" ? "웹 브라우저 실행 중" : "앱(App) 실행 중"}
        </Text>
      </View>

      {/* 조건부 렌더링:
        웹이면 <iframe> 사용, 앱이면 <WebView> 사용
      */}
      {Platform.OS === "web" ? (
        // 웹일 때는 iframe 대신 버튼 보여주기
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ marginBottom: 10 }}>
            보안상 웹에서는 바로 띄울 수 없습니다.
          </Text>
          <Pressable
            style={{ padding: 15, backgroundColor: "#03C75A", borderRadius: 8 }}
            onPress={() => Linking.openURL(url)} // 새 탭으로 열기
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              네이버 새 창으로 열기
            </Text>
          </Pressable>
        </View>
      ) : (
        // 앱일 때는 정상적으로 WebView 사용
        <WebView source={{ uri: url }} style={{ flex: 1 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 웹에서 전체 화면을 채우기 위해 높이 설정이 필요할 수 있습니다.
    height: Platform.OS === "web" ? ("100vh" as any) : "100%",
  },
  header: {
    padding: 10,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
