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
              setUsername(username);
            }}
          />
        </View>
        <View>
          <Text>password:</Text>
          <TextInput />
        </View>
        <View>
          <Text>password 재입력:</Text>
          <TextInput />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
