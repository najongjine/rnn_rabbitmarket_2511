import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingProps {
  visible: boolean;
  text?: string;
}

const Loading = ({ visible, text = "Loading..." }: LoadingProps) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});
