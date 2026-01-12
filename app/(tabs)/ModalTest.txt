import { useState } from "react";
import {
  Button,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ModalTest() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <ScrollView>
          <View>
            <Text> 저는 모달창이 열린거에요</Text>
            <Text> 팝업 공격 당하셨습니다</Text>
          </View>
          <View>
            <Button
              title="닫기"
              onPress={() => {
                setModalVisible(false);
              }}
            />
          </View>
        </ScrollView>
      </Modal>

      <View>
        <Text>저는 원래 화면 이에요</Text>
        <Button
          title="모달창 열기"
          onPress={() => {
            setModalVisible(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
