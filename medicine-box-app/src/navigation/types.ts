/**
 * React Navigation 类型定义
 */

import {
  StackNavigationProp,
  StackScreenProps,
} from '@react-navigation/stack';
import {
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { Medicine } from '@/types/medicine';

/**
 * 根导航参数列表（Auth Stack + Main Stack）
 */
export type RootStackParamList = {
  // Auth Stack
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main Stack (已认证用户)
  Main: undefined;
};

/**
 * Auth导航参数列表
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/**
 * 主导航参数列表（包含Bottom Tab和Stack导航）
 */
export type MainStackParamList = {
  MainTab: undefined;
  Family: undefined;
  FamilyMembers: undefined;

  // 药品管理
  AddMedicine: { medicine?: Medicine };
  ScanBarcode: undefined;
  OCRScreen: undefined;
  MedicineDetail: { medicine: Medicine };

  // 用药计划
  AddSchedule: { scheduleId?: string };
  ScheduleDetail: { scheduleId: string };

  // 设备
  ConnectBox: undefined;
  BoxControl: { deviceId: string };

  // 其他
  FamilyMemberCalendar: { userId: string };
  Settings: undefined;
  EditProfile: undefined;
  Disclaimer: undefined;
  About: undefined;
  NotificationSettings: undefined;
  NotificationDetail: { notificationId: string };
  AccessibilitySettings: undefined;
};

/**
 * 主页Tab导航参数列表
 */
export type MainTabParamList = {
  Home: undefined;
  Box: undefined;
  Medicines: undefined;
  Schedule: undefined;
  Report: undefined;
  Family: undefined;
};

/**
 * 导航Hock类型
 */
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainStackNavigationProp = StackNavigationProp<MainStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

/**
 * 屏幕Props类型
 */
export type AuthScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type MainScreenProps<T extends keyof MainStackParamList> = StackScreenProps<
  MainStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: MainTabNavigationProp;
  route: { params?: any };
};
