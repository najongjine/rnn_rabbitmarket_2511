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
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
  const kakaoRestapiKey = process.env.EXPO_PUBLIC_KAKAO_RESTAPI_KEY;
  const queryString = useLocalSearchParams();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {}, []));

  async function onLogin() {
    // 1. 유효성 검사
    if (!username || !password) {
      setErrorMsg("아이디, 비밀번호, 닉네임은 필수입니다.");
      alert("아이디, 비밀번호, 닉네임은 필수입니다.");
      return;
    }

    try {
      // 2. FormData 생성
      const formData = new FormData();

      // 문자열 데이터 추가
      formData.append("username", username);
      formData.append("password", password);

      // 3. 서버 전송
      // 엔드포인트가 /register 라고 가정 (서버 설정에 맞게 수정 필요)
      const response = await fetch(`${apiUrl}/api/user/login`, {
        method: "POST",
        body: formData,
        // 주의: FormData 사용 시 Content-Type 헤더를 직접 설정하지 않는 것이 좋습니다.
        // fetch가 자동으로 boundary를 설정합니다.
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        setErrorMsg("");
        alert("로그인 성공.");
        let userInfo = result?.data?.userInfo;
        let token = result?.data?.token;
        await signIn(userInfo, token);
        console.log(`userInfo: `, userInfo);
        console.log(`token: `, token);
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
            secureTextEntry
            onChangeText={(e) => {
              setPassword(e);
            }}
          />
        </View>

        <View>
          <Button title="로그인" onPress={onLogin} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
