import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CLOUDBASE_CONFIG from '@/config/cloudbaseConfig';
import { User, UserSettings } from '@/types/user';

interface CloudBaseUser {
  uid: string;
  email?: string | null;
  phone?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface AuthState {
  isLoading: boolean;
  user: CloudBaseUser | null;
  userProfile: User | null;
  error: string | null;
  isLoggedIn: boolean;

  initialize: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, nickname: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  checkPasswordStrength: (password: string) => PasswordStrength;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const defaultUserSettings: UserSettings = {
  quietMode: false,
  lowStockThreshold: 5,
  pushNotifications: true,
  notificationSound: 'default',
  language: 'zh-CN',
};

const API_BASE = `https://${CLOUDBASE_CONFIG.env}.api.tcloudbasegateway.com`;

export const useCloudBaseAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      user: null,
      userProfile: null,
      error: null,
      isLoggedIn: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          const stored = await AsyncStorage.getItem('cloudbase_session');
          if (stored) {
            const session = JSON.parse(stored);
            if (session.user && session.access_token) {
              const profile: User = {
                id: session.user.uid,
                name: session.user.nickname || '用户',
                email: session.user.email,
                phone: session.user.phone,
                avatar: session.user.avatarUrl,
                familyId: null,
                role: 'member',
                deviceId: null,
                settings: defaultUserSettings,
                createdAt: new Date(session.user.created_at),
                updatedAt: new Date(session.user.updated_at),
              };
              set({
                user: session.user,
                userProfile: profile,
                isLoggedIn: true,
                isLoading: false,
              });
            }
          }
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Init error:', error);
          set({ isLoading: false });
        }
      },

      checkPasswordStrength: (password: string): PasswordStrength => {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        if (score <= 2) {
          return { score, label: '弱', color: '#EF5350' };
        } else if (score <= 4) {
          return { score, label: '中等', color: '#FFA726' };
        } else {
          return { score, label: '强', color: '#66BB6A' };
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/v1/signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });
          const result = await response.json();
          
          if (result.error) {
            let errorMessage = result.error_description || '登录失败';
            if (result.error === 'invalid_credentials') {
              errorMessage = '邮箱或密码错误';
            } else if (result.error === 'user_not_found') {
              errorMessage = '用户不存在，请先注册';
            }
            set({ isLoading: false, error: errorMessage });
            return;
          }

          const profile: User = {
            id: result.sub || result.user?.id,
            name: result.user?.nickname || email.split('@')[0],
            email: email,
            phone: result.user?.phone || null,
            avatar: result.user?.avatarUrl || null,
            familyId: null,
            role: 'member',
            deviceId: null,
            settings: defaultUserSettings,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const userData: CloudBaseUser = {
            uid: result.sub || result.user?.id,
            email: email,
            nickname: result.user?.nickname || email.split('@')[0],
            phone: result.user?.phone,
            avatarUrl: result.user?.avatarUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await AsyncStorage.setItem('cloudbase_session', JSON.stringify({
            user: userData,
            access_token: result.access_token || result.session?.access_token,
            refresh_token: result.refresh_token || result.session?.refresh_token,
          }));

          set({
            user: userData,
            userProfile: profile,
            isLoggedIn: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || '登录失败，请检查网络' });
        }
      },

      registerWithEmail: async (email: string, password: string, nickname: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              username: nickname,
            }),
          });
          const result = await response.json();
          
          if (result.error) {
            let errorMessage = result.error_description || '注册失败';
            if (result.error === 'email_already_exists') {
              errorMessage = '该邮箱已被注册';
            } else if (result.error === 'weak_password') {
              errorMessage = '密码强度不足，请设置更复杂的密码';
            } else if (result.error === 'invalid_email') {
              errorMessage = '邮箱格式不正确';
            }
            set({ isLoading: false, error: errorMessage });
            return;
          }

          const profile: User = {
            id: result.sub || result.user?.id,
            name: nickname,
            email: email,
            phone: null,
            avatar: null,
            familyId: null,
            role: 'member',
            deviceId: null,
            settings: defaultUserSettings,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const userData: CloudBaseUser = {
            uid: result.sub || result.user?.id,
            email: email,
            nickname: nickname,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await AsyncStorage.setItem('cloudbase_session', JSON.stringify({
            user: userData,
            access_token: result.access_token || result.session?.access_token,
            refresh_token: result.refresh_token || result.session?.refresh_token,
          }));

          set({
            user: userData,
            userProfile: profile,
            isLoggedIn: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || '注册失败，请检查网络' });
        }
      },

      sendPasswordResetEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/v1/password/reset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
            }),
          });
          const result = await response.json();
          
          if (result.error) {
            set({ isLoading: false, error: result.error_description || '发送失败' });
            return { success: false, message: result.error_description || '发送失败' };
          }

          set({ isLoading: false });
          return { success: true, message: '重置密码邮件已发送，请查收邮箱' };
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          return { success: false, message: error.message || '发送失败，请检查网络' };
        }
      },

      updatePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const sessionStr = await AsyncStorage.getItem('cloudbase_session');
          if (!sessionStr) {
            set({ isLoading: false, error: '用户未登录' });
            return { success: false, message: '用户未登录' };
          }

          const session = JSON.parse(sessionStr);
          
          const response = await fetch(`${API_BASE}/auth/v1/password/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              old_password: oldPassword,
              new_password: newPassword,
            }),
          });
          const result = await response.json();
          
          if (result.error) {
            let errorMessage = result.error_description || '修改密码失败';
            if (result.error === 'invalid_password') {
              errorMessage = '原密码错误';
            }
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage };
          }

          set({ isLoading: false });
          return { success: true, message: '密码修改成功' };
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          return { success: false, message: error.message || '修改密码失败' };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await AsyncStorage.removeItem('cloudbase_session');
          await AsyncStorage.clear();
          set({
            user: null,
            userProfile: null,
            isLoggedIn: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            isLoading: false,
            userProfile: state.userProfile
              ? { ...state.userProfile, ...data, updatedAt: new Date() }
              : null,
          }));
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cloudbase-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export const isAuthenticated = (): boolean => {
  return useCloudBaseAuthStore.getState().isLoggedIn;
};
