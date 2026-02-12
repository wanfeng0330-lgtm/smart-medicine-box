import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebaseConfig';
import { Family, FamilyMember, FamilyInvite, FamilyRole } from '@/types/family';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '@/types/user';

/**
 * 生成随机邀请码（6位大写字母+数字）
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * 家庭状态
 */
interface FamilyState {
  // 状态
  isLoading: boolean;
  currentFamily: Family | null;
  members: FamilyMember[];
  error: string | null;

  // Actions
  createFamily: (name: string) => Promise<void>;
  joinFamily: (inviteCode: string) => Promise<void>;
  fetchFamily: (familyId: string) => Promise<void>;
  fetchFamilyMembers: () => Promise<void>;
  addMember: (userId: string, role?: FamilyRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: FamilyRole) => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
  leaveFamily: () => Promise<void>;
  deleteFamily: () => Promise<void>;
  clearError: () => void;
}

/**
 * Family Store
 */
export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      currentFamily: null,
      members: [],
      error: null,

      // 创建家庭组
      createFamily: async (name) => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // 生成家庭ID和邀请码
          const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const inviteCode = generateInviteCode();

          // 创建家庭组文档
          const newFamily: Omit<Family, 'createdAt'> = {
            id: familyId,
            name,
            adminId: user.uid,
            inviteCode,
            members: [user.uid],
            boxDeviceId: null,
          };

          const familyRef = doc(db, 'families', familyId);
          await setDoc(familyRef, {
            ...newFamily,
            createdAt: new Date(),
          });

          // 更新用户的familyId
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            familyId,
            role: 'admin' as FamilyRole,
            updatedAt: new Date(),
          });

          set({
            isLoading: false,
            currentFamily: { ...newFamily, createdAt: new Date() },
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '创建家庭失败',
          });
        }
      },

      // 加入家庭组
      joinFamily: async (inviteCode) => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // 查询邀请码对应的家庭组
          const familiesQuery = query(
            collection(db, 'families'),
            where('inviteCode', '==', inviteCode)
          );
          const querySnapshot = await getDocs(familiesQuery);

          if (querySnapshot.empty) {
            set({
              isLoading: false,
              error: '邀请码无效',
            });
            return;
          }

          if (querySnapshot.size > 1) {
            set({
              isLoading: false,
              error: '邀请码冲突，请联系管理员',
            });
            return;
          }

          const familyDoc = querySnapshot.docs[0];
          const family = familyDoc.data() as Family;
          const userRef = doc(db, 'users', user.uid);
          const familyRef = doc(db, 'families', family.id);

          // 检查用户是否已加入其他家庭组
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.familyId && userData.familyId !== family.id) {
              set({
                isLoading: false,
                error: '您已加入其他家庭组，请先退出',
              });
              return;
            }
          }

          // 检查用户是否已在当前家庭组
          if (family.members.includes(user.uid)) {
            set({
              isLoading: false,
              error: '您已在当前家庭组中',
            });
            return;
          }

          // 更新家庭组成员列表
          await updateDoc(familyRef, {
            members: [...family.members, user.uid],
          });

          // 更新用户的familyId
          await updateDoc(userRef, {
            familyId: family.id,
            role: 'member' as FamilyRole,
            updatedAt: new Date(),
          });

          set({
            isLoading: false,
            currentFamily: family,
            error: null,
          });

          // 获取家庭成员列表
          get().fetchFamilyMembers();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '加入家庭失败',
          });
        }
      },

      // 获取家庭组信息
      fetchFamily: async (familyId) => {
        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', familyId);
          const familyDoc = await getDoc(familyRef);

          if (!familyDoc.exists()) {
            set({
              isLoading: false,
              currentFamily: null,
              error: '家庭组不存在',
            });
            return;
          }

          const family = familyDoc.data() as Family;
          set({
            isLoading: false,
            currentFamily: family,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '获取家庭组信息失败',
          });
        }
      },

      // 获取家庭成员列表
      fetchFamilyMembers: async () => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const members: FamilyMember[] = [];

          for (const userId of currentFamily.members) {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              members.push({
                userId: userData.id,
                name: userData.name,
                avatar: userData.avatar,
                role: userData.role!,
                deviceId: userData.deviceId,
              });
            }
          }

          set({
            isLoading: false,
            members,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '获取家庭成员失败',
          });
        }
      },

      // 添加家庭成员
      addMember: async (userId, role = 'member') => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 检查是否为管理员
        if (currentFamily.adminId !== user.uid) {
          set({ error: '只有管理员可以添加成员' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', currentFamily.id);
          const userRef = doc(db, 'users', userId);

          // 更新家庭组成员列表
          await updateDoc(familyRef, {
            members: [...currentFamily.members, userId],
          });

          // 更新用户的familyId和role
          await updateDoc(userRef, {
            familyId: currentFamily.id,
            role,
            updatedAt: new Date(),
          });

          set((state) => ({
            isLoading: false,
            currentFamily: {
              ...state.currentFamily!,
              members: [...state.currentFamily!.members, userId],
            },
            error: null,
          }));

          // 重新获取成员列表
          get().fetchFamilyMembers();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '添加成员失败',
          });
        }
      },

      // 移除家庭成员
      removeMember: async (userId) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 检查是否为管理员
        if (currentFamily.adminId !== user.uid) {
          set({ error: '只有管理员可以移除成员' });
          return;
        }

        // 不能移除管理员
        if (userId === currentFamily.adminId) {
          set({ error: '不能移除管理员' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', currentFamily.id);
          const userRef = doc(db, 'users', userId);

          // 更新家庭组成员列表
          await updateDoc(familyRef, {
            members: currentFamily.members.filter((id) => id !== userId),
          });

          // 移除用户的familyId
          await updateDoc(userRef, {
            familyId: null,
            role: null,
            updatedAt: new Date(),
          });

          set((state) => ({
            isLoading: false,
            currentFamily: {
              ...state.currentFamily!,
              members: state.currentFamily!.members.filter((id) => id !== userId),
            },
            error: null,
          }));

          // 重新获取成员列表
          get().fetchFamilyMembers();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '移除成员失败',
          });
        }
      },

      // 更新成员角色
      updateMemberRole: async (userId, role) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 检查是否为管理员
        if (currentFamily.adminId !== user.uid) {
          set({ error: '只有管理员可以修改成员角色' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            role,
            updatedAt: new Date(),
          });

          set((state) => ({
            isLoading: false,
            members: state.members.map((member) =>
              member.userId === userId ? { ...member, role } : member
            ),
            error: null,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '更新成员角色失败',
          });
        }
      },

      // 更新家庭组名称
      updateFamilyName: async (name) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 检查是否为管理员
        if (currentFamily.adminId !== user.uid) {
          set({ error: '只有管理员可以修改家庭组名称' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', currentFamily.id);
          await updateDoc(familyRef, {
            name,
            updatedAt: new Date(),
          });

          set((state) => ({
            isLoading: false,
            currentFamily: {
              ...state.currentFamily!,
              name,
            },
            error: null,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '更新家庭组名称失败',
          });
        }
      },

      // 退出家庭组
      leaveFamily: async () => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 管理员不能直接退出（需要转让或删除家庭组）
        if (currentFamily.adminId === user.uid) {
          set({ error: '管理员不能直接退出，请先转让管理员或删除家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', currentFamily.id);
          const userRef = doc(db, 'users', user.uid);

          // 更新家庭组成员列表
          await updateDoc(familyRef, {
            members: currentFamily.members.filter((id) => id !== user.uid),
          });

          // 移除用户的familyId
          await updateDoc(userRef, {
            familyId: null,
            role: null,
            updatedAt: new Date(),
          });

          set({
            isLoading: false,
            currentFamily: null,
            members: [],
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '退出家庭组失败',
          });
        }
      },

      // 删除家庭组（仅管理员）
      deleteFamily: async () => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          set({ error: '用户未登录' });
          return;
        }

        // 只有管理员可以删除家庭组
        if (currentFamily.adminId !== user.uid) {
          set({ error: '只有管理员可以删除家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const familyRef = doc(db, 'families', currentFamily.id);

          // 删除家庭组文档
          await deleteDoc(familyRef);

          // 更新所有成员的familyId
          for (const memberId of currentFamily.members) {
            const userRef = doc(db, 'users', memberId);
            await updateDoc(userRef, {
              familyId: null,
              role: null,
              updatedAt: new Date(),
            });
          }

          set({
            isLoading: false,
            currentFamily: null,
            members: [],
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '删除家庭组失败',
          });
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'family-storage',
      storage: AsyncStorage,
      partialize: (state) => ({
        currentFamily: state.currentFamily,
        members: state.members,
      }),
    }
  )
);

/**
 * 辅助函数 - 检查当前用户是否为家庭管理员
 */
export const isFamilyAdmin = (): boolean => {
  const { currentFamily } = useFamilyStore.getState();
  const user = auth.currentUser;
  return !!(currentFamily && user && currentFamily.adminId === user.uid);
};

/**
 * 辅助函数 - 检查是否已加入家庭组
 */
export const isInFamily = (): boolean => {
  const { currentFamily } = useFamilyStore.getState();
  return currentFamily !== null;
};
