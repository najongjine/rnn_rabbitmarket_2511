import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Button,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KakaoAddressResponse } from "../types/types";

const { width } = Dimensions.get("window");

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [addr, setAddr] = useState("");
  const [nickname, setNickname] = useState("");
  const [phonenum, setPhonenum] = useState("");

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const kakaoRestapiKey = process.env.EXPO_PUBLIC_KAKAO_RESTAPI_KEY;
  const queryString = useLocalSearchParams();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function getCurrentLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("위치 권한이 거부되었습니다.");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    getAddr(location);
  }

  async function getAddr(_location: Location.LocationObject) {
    try {
      // 3. 카카오 API 호출 URL 생성
      const params = new URLSearchParams({
        x: String(_location?.coords?.longitude), // longitude
        y: String(_location?.coords?.latitude), // lat
      });

      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?${params.toString()}`;

      // 4. fetch로 API 요청
      const response = await fetch(url, {
        method: "GET",
        headers: {
          // 주의: 'KakaoAK ' 뒤에 공백이 한 칸 있어야 합니다.
          Authorization: `KakaoAK ${kakaoRestapiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Kakao API Error: ${response.status} ${response.statusText}`
        );
      }

      // 5. 응답 데이터를 타입에 맞춰 파싱
      const data = (await response.json()) as KakaoAddressResponse;
      let addr = data.documents[0].road_address?.address_name || "";
      if (!addr) {
        addr = data.documents[0].address?.address_name || "";
      }
      console.log(`addr: `, addr);
      if (!addr) {
        alert(`자동 주소가져오기 실패. 수동으로 주소 입력해 주세요`);
        setErrorMsg(`자동 주소가져오기 실패. 수동으로 주소 입력해 주세요`);
        return;
      }
      setAddr(addr);
      setErrorMsg("");
    } catch (error: any) {
      alert(`!error. ${error?.message}`);
      setErrorMsg(`!error. ${error?.message}`);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getCurrentLocation();
    }, [])
  );

  async function onRegister() {
    // 1. 유효성 검사
    if (!username || !password || !nickname) {
      setErrorMsg("아이디, 비밀번호, 닉네임은 필수입니다.");
      alert("아이디, 비밀번호, 닉네임은 필수입니다.");
      return;
    }

    if (password !== repassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // 2. FormData 생성
      const formData = new FormData();

      // 문자열 데이터 추가
      formData.append("username", username);
      formData.append("password", password);
      formData.append("addr", addr);
      formData.append("nickname", nickname);
      formData.append("phonenum", phonenum);

      // 위치 데이터 추가 (없으면 0.0 또는 빈 문자열 처리)
      const longitude = location?.coords?.longitude
        ? String(location.coords.longitude)
        : "0.0";
      const latitude = location?.coords?.latitude
        ? String(location.coords.latitude)
        : "0.0";

      formData.append("long", longitude);
      formData.append("lat", latitude);

      // 3. 서버 전송
      // 엔드포인트가 /register 라고 가정 (서버 설정에 맞게 수정 필요)
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        body: formData,
        // 주의: FormData 사용 시 Content-Type 헤더를 직접 설정하지 않는 것이 좋습니다.
        // fetch가 자동으로 boundary를 설정합니다.
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        setErrorMsg("");
        alert("회원가입이 완료되었습니다.");
        router.replace("/");
      } else {
        setErrorMsg(result?.msg || "회원가입에 실패했습니다.");
        alert(result?.msg || "회원가입에 실패했습니다.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`서버 통신 중 오류 발생: ${error?.message}`);
    }
  }

  return (
    <View>
      <ScrollView>
        <View>
          <Text>회원가입</Text>
        </View>
        <View>
          <Text>username:</Text>
          <TextInput
            value={username}
            onChangeText={(e) => {
              setUsername(e);
            }}
          />
        </View>
        <View>
          <Text>password:</Text>
          <TextInput
            value={password}
            onChangeText={(e) => {
              setPassword(e);
            }}
          />
        </View>
        <View>
          <Text>password 재입력:</Text>
          <TextInput
            value={repassword}
            onChangeText={(e) => {
              setRePassword(e);
            }}
          />
        </View>
        <View>
          <Text>주소:</Text>
          <TextInput
            value={addr}
            onChangeText={(e) => {
              setAddr(e);
            }}
          />
        </View>
        <View>
          <Text>닉네임:</Text>
          <TextInput
            value={nickname}
            onChangeText={(e) => {
              setNickname(e);
            }}
          />
        </View>
        <View>
          <Text>전화번호:</Text>
          <TextInput
            value={phonenum}
            onChangeText={(e) => {
              setPhonenum(e);
            }}
          />
        </View>
        <View>
          <Button title="회원가입" onPress={onRegister} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
