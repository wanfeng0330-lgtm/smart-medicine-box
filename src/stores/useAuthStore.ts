import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth, db } from '@/config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'Firestore';
import { User, UserRole, UserSettings } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 认证状态
 */
interface AuthState {
  // 状态
  isLoading: boolean;
  user: FirebaseUser | null;
  userProfile: User | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  loginWithPhone: (phoneNumber: string, verificationCode: string) => Promise<void>;
  sendPhoneVerificationCode: (phoneNumber: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

/**
 * 默认用户设置
 */
const defaultUserSettings: UserSettings = {
  quietMode: false,
  lowStockThreshold: 5,
  pushNotifications: true,
  notificationSound: 'default',
  language: 'zh-CN',
};

/**
 * 创建用户文档（如果不存在）
 */
const createUserDocument = async (firebaseUser: FirebaseUser): Promise<void> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const newUser: Partial<User> = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email,
      phone: firebaseUser.phoneNumber,
      avatar: firebaseUser.photoURL,
      familyId: null,
      role: 'member',
      deviceId: null,
      settings: defaultUserSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, newUser);
  }
};

/**
 * 获取用户配置文件
 */
const fetchUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * 更新用户配置文件
 */
const updateUserProfileDocument = async (
  uid: string,
  data: Partial<User>,
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date(),
  });
};

/**
 * Auth Store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      user: null,
      userProfile: null,
      error: null,

      // 初始化认证监听
      initialize: async () => {
        set({ isLoading: true });

        try {
          // TODO: Firebase Auth监听器
          // 这里需要实际的Firebase配置才能工作
          // 当前使用模拟数据占位
          set({
            isLoading: false,
            user: null,
            userProfile: null,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: '初始化失败，请检查Firebase配置',
          });
        }
      },

      // 邮箱登录
      loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: 需要Firebase配置
          // const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // await createUserDocument(userCredential.user);
          // const userProfile = await fetchUserProfile(userCredential.user.uid);
          set({
            isLoading: false,
            error: '需要配置Firebase后才能使用邮箱登录',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '登录失败',
          });
        }
      },

      // 邮箱注册
      registerWithEmail: async (email, password, name) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: 需要Firebase配置
          // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          // await firebaseUpdateProfile(userCredential.user, { displayName: name });
          // await createUserDocument(userCredential.user);
          // const userProfile = await fetchUserProfile(userCredential.user.uid);
          set({
            isLoading: false,
            error: '需要配置Firebase后才能使用邮箱注册',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '注册失败',
          });
        }
      },

      // 手机号码登录（使用验证码）
      loginWithPhone: async (phoneNumber, verificationCode) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: 需要Firebase配置
          set({
            isLoading: false,
            error: '需要配置Firebase后才能使用手机登录',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '登录失败',
          });
        }
      },

      // 发送手机验证码
      sendPhoneVerificationCode: async (phoneNumber) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: 需要Firebase配置
          set({
            isLoading: false,
            error: '需要配置Firebase后才能发送验证码',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '发送验证码失败',
          });
        }
      },

      // 重置密码
      resetPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: 需要Firebase配置
          // await sendPasswordResetEmail(auth, email);
          set({
            isLoading: false,
            error: '需要配置Firebase后才能重置密码',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '重置密码失败',
          });
        }
      },

      // 登出
      logout: async () => {
        set({ isLoading: true });

        try {
          // TODO: 需要Firebase配置
          // await firebaseSignOut(auth);
          await AsyncStorage.clear();

          set({
            isLoading: false,
            user: null,
            userProfile: null,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '登出失败',
          });
        }
      },

      // 更新用户配置文件
      updateProfile: async (data) => {
        const { user } = get();

        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // 更新Firestore用户文档
          await updateUserProfileDocument(user.uid, data);

          // 更新本地状态
          set((state) => ({
            isLoading: false,
            userProfile: state.userProfile
              ? { ...state.userProfile, ...data, updatedAt: new Date() }
              : null,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '更新配置文件失败',
          });
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
      // 只持久化基本信息，不持久化敏感数据
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
      }),
    }
  )
);

/**
 * 辅助函数 - 检查用户是否登录
 */
export const isAuthenticated = (): boolean => {
  const { user } = useAuthStore.getState();
  return user !== null;
};

/**
 * 辅助函数 - 检查用户是否有管理员权限
 */
export const isAdmin = (): boolean => {
  const { userProfile } = useAuthStore.getState();
  return userProfile?.role === 'admin';
};
