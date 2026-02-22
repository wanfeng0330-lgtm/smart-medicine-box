import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Family, FamilyMember, FamilyRole } from '@/types/family';
import APP_CONFIG from '@/config/appConfig';

const { DEV_MODE } = APP_CONFIG;

interface FamilyState {
  isLoading: boolean;
  currentFamily: Family | null;
  members: FamilyMember[];
  error: string | null;
  currentUserId: string | null;

  setCurrentUserId: (userId: string | null) => void;
  createFamily: (name: string, adminId: string) => Promise<Family>;
  joinFamily: (inviteCode: string, userId: string) => Promise<void>;
  fetchFamily: (familyId: string) => Promise<void>;
  fetchFamilyMembers: () => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: FamilyRole) => Promise<void>;
  leaveFamily: (userId: string) => Promise<void>;
  deleteFamily: () => Promise<void>;
  clearError: () => void;
}

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useCloudBaseFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      currentFamily: null,
      members: [],
      error: null,
      currentUserId: null,

      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      createFamily: async (name: string, adminId: string) => {
        set({ isLoading: true, error: null });

        try {
          const familyId = `fam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const inviteCode = generateInviteCode();

          const family: Family = {
            id: familyId,
            name,
            adminId,
            inviteCode,
            members: [adminId],
            boxDeviceId: null,
            createdAt: new Date(),
          };

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_family', JSON.stringify(family));
          }

          set({
            isLoading: false,
            currentFamily: family,
            members: [{
              userId: adminId,
              name: '创建者',
              avatar: null,
              role: 'admin',
              deviceId: null,
            }],
            error: null,
          });

          return family;
        } catch (error: any) {
          console.error('Error creating family:', error);
          set({
            isLoading: false,
            error: error.message || '创建家庭组失败',
          });
          throw error;
        }
      },

      joinFamily: async (inviteCode: string, userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const { currentFamily } = get();
          if (!currentFamily) {
            set({ isLoading: false, error: '家庭组不存在' });
            return;
          }

          if (currentFamily.inviteCode.toUpperCase() !== inviteCode.toUpperCase()) {
            set({ isLoading: false, error: '邀请码错误' });
            return;
          }

          const updatedFamily = {
            ...currentFamily,
            members: [...currentFamily.members, userId],
          };

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_family', JSON.stringify(updatedFamily));
          }

          set({
            isLoading: false,
            currentFamily: updatedFamily,
            error: null,
          });
        } catch (error: any) {
          console.error('Error joining family:', error);
          set({
            isLoading: false,
            error: error.message || '加入家庭组失败',
          });
        }
      },

      fetchFamily: async (familyId: string) => {
        set({ isLoading: true, error: null });

        try {
          if (DEV_MODE) {
            const stored = await AsyncStorage.getItem('dev_family');
            if (stored) {
              const family = JSON.parse(stored);
              set({
                isLoading: false,
                currentFamily: family,
                error: null,
              });
            } else {
              set({
                isLoading: false,
                currentFamily: null,
                error: null,
              });
            }
          }
        } catch (error: any) {
          console.error('Error fetching family:', error);
          set({
            isLoading: false,
            error: error.message || '获取家庭组信息失败',
          });
        }
      },

      fetchFamilyMembers: async () => {
        set({ isLoading: true, error: null });

        try {
          if (DEV_MODE) {
            const stored = await AsyncStorage.getItem('dev_members');
            const members = stored ? JSON.parse(stored) : [];
            set({
              isLoading: false,
              members,
              error: null,
            });
          }
        } catch (error: any) {
          console.error('Error fetching members:', error);
          set({
            isLoading: false,
            error: error.message || '获取成员信息失败',
          });
        }
      },

      updateFamilyName: async (name: string) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const updatedFamily = { ...currentFamily, name };

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_family', JSON.stringify(updatedFamily));
          }

          set({
            isLoading: false,
            currentFamily: updatedFamily,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '更新名称失败',
          });
        }
      },

      removeMember: async (userId: string) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        if (currentFamily.adminId === userId) {
          set({ error: '不能移除管理员' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const updatedFamily = {
            ...currentFamily,
            members: currentFamily.members.filter((id) => id !== userId),
          };

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_family', JSON.stringify(updatedFamily));
          }

          set((state) => ({
            isLoading: false,
            currentFamily: updatedFamily,
            members: state.members.filter((m) => m.userId !== userId),
            error: null,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '移除成员失败',
          });
        }
      },

      updateMemberRole: async (userId: string, role: FamilyRole) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          set((state) => ({
            isLoading: false,
            members: state.members.map((m) =>
              m.userId === userId ? { ...m, role } : m
            ),
            error: null,
          }));
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '更新角色失败',
          });
        }
      },

      leaveFamily: async (userId: string) => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        if (currentFamily.adminId === userId) {
          set({ error: '管理员不能退出家庭组，请先转让管理员或解散家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const updatedFamily = {
            ...currentFamily,
            members: currentFamily.members.filter((id) => id !== userId),
          };

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_family', JSON.stringify(updatedFamily));
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
            error: error.message || '退出失败',
          });
        }
      },

      deleteFamily: async () => {
        const { currentFamily } = get();
        if (!currentFamily) {
          set({ error: '未加入家庭组' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          if (DEV_MODE) {
            await AsyncStorage.removeItem('dev_family');
            await AsyncStorage.removeItem('dev_members');
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
            error: error.message || '解散失败',
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cloudbase-family-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentFamily: state.currentFamily,
        members: state.members,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
