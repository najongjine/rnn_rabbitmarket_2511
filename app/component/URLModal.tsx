import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform, // 1. Platform 모듈 추가
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
}

export default function URLModal({
  visible,
  onClose,
  url = "",
  title = "상세 보기",
}: ModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* 상단 헤더: 제목과 우측 닫기 버튼 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 웹뷰 영역 */}
        <View style={styles.webviewContainer}>
          {/* 2. 플랫폼에 따른 분기 처리 */}
          {Platform.OS === "web" ? (
            <iframe
              src={url}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={title}
            />
          ) : (
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              startInLoadingState={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // 제목 중앙 정렬
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    position: "relative",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  webviewContainer: {
    flex: 1,
    // 웹에서 iframe이 부모 컨테이너 크기를 채우게 하려면 아래 스타일이 중요할 수 있음
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});
