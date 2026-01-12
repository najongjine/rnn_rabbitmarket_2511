import { useState } from "react";
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
