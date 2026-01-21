import React, { useState } from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
// 👇 여기가 핵심입니다. 웹용(react-daum-postcode)이 아니라 이걸 써야 합니다.
import Postcode from "@actbase/react-daum-postcode";

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_RESTAPI_KEY;

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface KakaoGeocodeResponse {
  documents: Array<{
    address: { x: string; y: string };
  }>;
}

export default function MyPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const handleAddressSelected = async (data: any) => {
    setIsModalVisible(false);
    setAddress(data.address);
    await getGeoCode(data.address);
  };

  const getGeoCode = async (queryAddress: string) => {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(queryAddress)}`;
      const response = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      });
      const result = (await response.json()) as KakaoGeocodeResponse;

      if (result.documents && result.documents.length > 0) {
        const { x, y } = result.documents[0].address;
        setCoords({ latitude: parseFloat(y), longitude: parseFloat(x) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>주소 검색 (RN 전용)</Text>
        <Text>주소: {address}</Text>
        <Text>
          좌표: {coords?.latitude}, {coords?.longitude}
        </Text>

        <Button title="검색하기" onPress={() => setIsModalVisible(true)} />

        <Modal visible={isModalVisible} animationType="slide">
          <View style={{ flex: 1 }}>
            <Button
              title="닫기"
              onPress={() => setIsModalVisible(false)}
              color="red"
            />

            {/* 👇 이제 에러 안 납니다. */}
            <Postcode
              style={{ width: "100%", height: "100%" }}
              jsOptions={{ animation: true }}
              onSelected={handleAddressSelected}
              onError={(err: any) => console.warn(err)}
            />
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#fff" },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
});
