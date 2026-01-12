// store/useAuthStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// 서버에서 받아올 유저 정보 타입 정의 (필요에 따라 수정하세요)
export interface UserInfo {
  username: string;
  nickname: string;
  addr?: string;
  // 추가 필드들...
}

interface AuthState {
  userInfo: UserInfo | null;
  token: string | null;
  // 로그인(회원가입) 성공 시 호출할 함수
  setAuth: (userInfo: UserInfo, token: string) => void;
  // 로그아웃 시 호출할 함수
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      setAuth: (userInfo, token) => set({ userInfo, token }),
      logout: () => set({ userInfo: null, token: null }),
    }),
    {
      name: "auth-storage", // 저장소 이름 (Key)
      storage: createJSONStorage(() => AsyncStorage), // AsyncStorage 사용 설정
    }
  )
);
