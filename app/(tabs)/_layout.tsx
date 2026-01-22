import { Tabs } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userInfo, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: true,
          tabBarButton: HapticTab,
          headerRight: () =>
            userInfo ? (
              <TouchableOpacity onPress={signOut} style={{ marginRight: 15 }}>
                <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                  Logout
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Detail"
          options={{
            title: "Detail",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
            href: null,
          }}
        />
        <Tabs.Screen
          name="UploadItem"
          options={{
            title: "UploadItem",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
            href: null,
          }}
        />
        <Tabs.Screen
          name="Login"
          options={{
            title: "Login",
            href: userInfo ? null : undefined,
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="arrow.right.circle.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Register"
          options={{
            title: "Register",
            href: userInfo ? null : undefined,
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="person.crop.circle.badge.plus"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="MyPage"
          options={{
            title: "MyPage",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
