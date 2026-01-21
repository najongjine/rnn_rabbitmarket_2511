// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// 타입 정의
interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  addr?: string;
}

interface AuthContextType {
  userInfo: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  signIn: (userInfo: UserInfo, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 1. Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider 컴포넌트 (앱 전체를 감쌀 녀석)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 켜질 때 저장된 정보 불러오기
  useEffect(() => {
    const loadStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        const storedToken = await AsyncStorage.getItem("token");

        if (storedUser && storedToken) {
          setUserInfo(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        console.error("Failed to load auth info", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorage();
  }, []);

  // 로그인 (저장)
  const signIn = async (newUser: UserInfo, newToken: string) => {
    try {
      setUserInfo(newUser);
      setToken(newToken);
      await AsyncStorage.setItem("userInfo", JSON.stringify(newUser));
      await AsyncStorage.setItem("token", newToken);
    } catch (e) {
      console.error(e);
    }
  };

  // 로그아웃 (삭제)
  const signOut = async () => {
    try {
      setUserInfo(null);
      setToken(null);
      await AsyncStorage.removeItem("userInfo");
      await AsyncStorage.removeItem("token");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ userInfo, token, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 3. 쉽게 쓰기 위한 커스텀 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
