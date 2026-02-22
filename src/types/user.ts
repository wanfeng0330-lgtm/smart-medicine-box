/**
 * 用户类型定义
 */

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'member';

/**
 * 用户设置
 */
export interface UserSettings {
  quietMode: boolean;
  lowStockThreshold: number;
  pushNotifications: boolean;
  notificationSound: string;
  language: string;
}

/**
 * 用户信息
 */
export interface User {
  id: string; // Firestore document ID
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  familyId: string | null;
  role: UserRole;
  deviceId: string | null;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 认证用户信息（来自Firebase Auth）
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * 用户信息类型
 */
export type UserInfo = {
  displayName: string;
  email: string;
  phoneNumber: string;
};
