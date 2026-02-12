/**
 * 家庭组类型定义
 */

/**
 * 用户角色
 */
export type FamilyRole = 'admin' | 'member';

/**
 * 家庭组信息
 */
export interface Family {
  id: string; // Firestore document ID
  name: string; // 家庭组名称
  adminId: string; // 管理员用户ID
  inviteCode: string; // 邀请码（用于QR码）
  members: string[]; // 成员用户ID列表
  boxDeviceId: string | null; // 关联的药盒设备ID
  createdAt: Date;
}

/**
 * 家庭成员信息（扩展用户信息）
 */
export interface FamilyMember {
  userId: string;
  name: string;
  avatar: string | null;
  role: FamilyRole;
  deviceId: string | null;
  medicationStatus?: {
    todayTaken: number;
    todayTotal: number;
    adherenceRate: number; // 0-100
  };
}

/**
 * 家庭组邀请信息
 */
export interface FamilyInvite {
  familyId: string;
  familyName: string;
  inviteCode: string;
  adminName: string;
}
