import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");

  const apiUrl = process.env.EXPO_PUBLIC_HONO_API_BASEURL;
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
  }

  useFocusEffect(
    useCallback(() => {
      getCurrentLocation();
    }, [])
  );

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
