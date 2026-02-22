import { create } from 'zustand';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebaseConfig';

import {
  Schedule,
  MedicationRecord,
  TodayMedication,
  MedicationStatus,
  DailyTime,
  REPEAT_LABELS,
  MEAL_LABELS,
  FREQUENCY_LABELS,
  RepeatType,
  MealLabel,
  FrequencyType,
} from '@/types/schedule';
import { User } from '@/types/user';

/**
 * 用药状态
 */
interface ScheduleState {
  // 状态
  isLoading: boolean;
  schedules: Schedule[];
  records: MedicationRecord[];
  error: string | null;
  user: User | null;

  // Actions - 用药计划管理
  fetchSchedules: (familyId: string) => Promise<void>;
  addSchedule: (
    familyId: string,
    medicineId: string,
    medicineName: string,
    medicineDosage: string,
    medicineUnit: string,
    repeatType: RepeatType,
    startDate: string,
    frequency: FrequencyType,
    dailyTimes: DailyTime[],
    repeatValue?: number,
    weekdays?: number[],
    endDate?: string,
    notes?: string
  ) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  toggleScheduleActive: (id: string) => Promise<void>;

  // Actions - 今日用药
  getTodayMedications: (familyId: string, date: string) => Promise<TodayMedication[]>;
  markAsTaken: (recordId: string) => Promise<void>;
  skipMedication: (recordId: string, notes?: string) => Promise<void>;

  // Actions - 用药记录
  fetchRecords: (familyId: string, startDate?: string, endDate?: string) => Promise<void>;
  addRecord: (
    familyId: string,
    userId: string,
    scheduleId: string,
    medicineId: string,
    date: string,
    time: string,
    dosage: string,
    mealLabel?: MealLabel
  ) => Promise<MedicationRecord>;

  // 辅助
  getRepeatLabel: (type: RepeatType) => string;
  getMealLabel: (label: MealLabel) => string;
  getFrequencyLabel: (type: FrequencyType) => string;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

/**
 * 获取唯一ID
 */
const generateId = (): string => {
  return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 检查是否应在指定日期执行
 */
const shouldExecuteOnDay = (
  schedule: Schedule,
  targetDate: string
): boolean => {
  if (!schedule.isActive) return false;

  const startCompare = targetDate.localeCompare(schedule.startDate);
  if (startCompare < 0) return false;

  if (schedule.endDate) {
    const endCompare = targetDate.localeCompare(schedule.endDate);
    if (endCompare > 0) return false;
  }

  switch (schedule.repeatType) {
    case 'daily':
      return true;
    case 'weekly':
      if (!schedule.weekdays) return false;
      const d = new Date(targetDate);
      return schedule.weekdays.includes(d.getDay());
    case 'monthly':
      if (!schedule.repeatValue) return false;
      const targetDay = parseInt(targetDate.split('-')[2], 10);
      const startDay = parseInt(schedule.startDate.split('-')[2], 10);
      const diffDays = (targetDay - startDay + 31) % 31;
      return diffDays % schedule.repeatValue === 0;
    case 'course':
      return true;
    case 'custom':
      return true;
    default:
      return false;
  }
};

/**
 * Schedule Store
 */
export const useScheduleStore = create<ScheduleState>()(
  (set, get) => ({
      // 初始状态
      isLoading: false,
      schedules: [],
      records: [],
      error: null,
      user: null,

      // 获取用药计划列表
      fetchSchedules: async (familyId: string) => {
        set({ isLoading: true, error: null });

        try {
          const q = query(
            collection(db, 'schedules'),
            where('familyId', '==', familyId),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(q);

          const schedules: Schedule[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: (data.createdAt as Timestamp).toDate(),
              updatedAt: (data.updatedAt as Timestamp).toDate(),
            } as Schedule;
          });

          set({
            isLoading: false,
            schedules,
            error: null,
          });
        } catch (error: any) {
          console.error('Error fetching schedules:', error);
          set({
            isLoading: false,
            error: error.message || '加载用药计划失败',
          });
        }
      },

      // 添加用药计划
      addSchedule: async (
        familyId: string,
        medicineId: string,
        medicineName: string,
        medicineDosage: string,
        medicineUnit: string,
        repeatType: RepeatType,
        startDate: string,
        frequency: FrequencyType,
        dailyTimes: DailyTime[],
        repeatValue?: number,
        weekdays?: number[],
        endDate?: string,
        notes?: string
      ) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '请先加入家庭组' });
          throw new Error('未加入家庭组');
        }

        set({ isLoading: true, error: null });

        try {
          const newSchedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
            familyId,
            medicineId,
            medicineName,
            medicineDosage,
            medicineUnit,
            repeatType,
            repeatValue,
            weekdays,
            startDate,
            endDate,
            frequency,
            dailyTimes,
            notes: notes || '',
            isActive: true,
          };

          const scheduleRef = doc(collection(db, 'schedules'));
          await setDoc(scheduleRef, newSchedule);
          const scheduleId = scheduleRef.id;

          const schedule: Schedule = {
            ...newSchedule,
            id: scheduleId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            isLoading: false,
            schedules: [schedule, ...state.schedules],
            error: null,
          }));

          return schedule;
        } catch (error: any) {
          console.error('Error adding schedule:', error);
          set({
            isLoading: false,
            error: error.message || '添加用药计划失败',
          });
          throw error;
        }
      },

      // 更新用药计划
      updateSchedule: async (id: string, data: Partial<Schedule>) => {
        const { user } = get();

        if (!user) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          const scheduleRef = doc(db, 'schedules', id);

          const updateData = {
            ...data,
            updatedAt: new Date(),
          };

          await updateDoc(scheduleRef, updateData);

          set((state) => ({
            isLoading: false,
            schedules: state.schedules.map((s) =>
              s.id === id ? { ...s, ...data, updatedAt: new Date() } : s
            ),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error updating schedule:', error);
          set({
            isLoading: false,
            error: error.message || '更新用药计划失败',
          });
          throw error;
        }
      },

      // 删除用药计划
      deleteSchedule: async (id: string) => {
        const { user } = get();

        if (!user) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          await deleteDoc(doc(db, 'schedules', id));

          set((state) => ({
            isLoading: false,
            schedules: state.schedules.filter((s) => s.id !== id),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error deleting schedule:', error);
          set({
            isLoading: false,
            error: error.message || '删除用药计划失败',
          });
          throw error;
        }
      },

      // 切换用药计划激活状态
      toggleScheduleActive: async (id: string) => {
        const { schedules } = get();
        const schedule = schedules.find((s) => s.id === id);

        if (!schedule) {
          throw new Error('用药计划不存在');
        }

        await get().updateSchedule(id, { isActive: !schedule.isActive });
      },

      // 获取今日用药
      getTodayMedications: async (familyId: string, date: string) => {
        set({ isLoading: true, error: null });

        try {
          // 获取所有活跃的用药计划
          const activeSchedules = get().schedules.filter((s) => s.isActive);

          const todayMedications: TodayMedication[] = [];

          for (const schedule of activeSchedules) {
            if (!shouldExecuteOnDay(schedule, date)) continue;

            for (const time of schedule.dailyTimes) {
              const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;

              // 查找已有记录
              const q = query(
                collection(db, 'records'),
                where('familyId', '==', familyId),
                where('scheduleId', '==', schedule.id),
                where('date', '==', date),
                where('time', '==', timeStr)
              );

              const querySnapshot = await getDocs(q);
              let record: MedicationRecord | undefined;

              if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                record = {
                  ...docData,
                  id: querySnapshot.docs[0].id,
                  createdAt: (docData.createdAt as Timestamp).toDate(),
                } as MedicationRecord;
              }

              todayMedications.push({
                scheduleId: schedule.id,
                medicineId: schedule.medicineId,
                medicineName: schedule.medicineName,
                medicineDosage: schedule.medicineDosage,
                medicineUnit: schedule.medicineUnit,
                time: timeStr,
                mealLabel: time.mealLabel,
                dosage: time.dosage,
                record,
                status: record?.status || 'scheduled',
              });
            }
          }

          // 按时间排序
          todayMedications.sort((a, b) => a.time.localeCompare(b.time));

          set({ isLoading: false, error: null });
          return todayMedications;
        } catch (error: any) {
          console.error('Error getting today medications:', error);
          set({
            isLoading: false,
            error: error.message || '获取今日用药失败',
          });
          return [];
        }
      },

      // 标记为已服
      markAsTaken: async (recordId: string) => {
        const { user } = get();

        if (!user) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        try {
          const updateData = {
            status: 'taken' as MedicationStatus,
            takenAt: new Date(),
            updatedAt: new Date(),
          };

          await updateDoc(doc(db, 'records', recordId), updateData);

          set((state) => ({
            records: state.records.map((r) =>
              r.id === recordId ? { ...r, ...updateData } : r
            ),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error marking as taken:', error);
          set({
            error: error.message || '标记失败',
          });
          throw error;
        }
      },

      // 跳过用药
      skipMedication: async (recordId: string, notes?: string) => {
        const { user } = get();

        if (!user) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        try {
          const updateData = {
            status: 'skipped' as MedicationStatus,
            skippedAt: new Date(),
            notes: notes || '',
            updatedAt: new Date(),
          };

          await updateDoc(doc(db, 'records', recordId), updateData);

          set((state) => ({
            records: state.records.map((r) =>
              r.id === recordId ? { ...r, ...updateData } : r
            ),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error skipping medication:', error);
          set({
            error: error.message || '跳过失败',
          });
          throw error;
        }
      },

      // 获取用药记录
      fetchRecords: async (familyId: string, startDate?: string, endDate?: string) => {
        set({ isLoading: true, error: null });

        try {
          let q = query(
            collection(db, 'records'),
            where('familyId', '==', familyId),
            orderBy('date', 'desc')
          );

          if (startDate) {
            // TODO: 添加日期范围过滤
          }

          const querySnapshot = await getDocs(q);

          const records: MedicationRecord[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: (data.createdAt as Timestamp).toDate(),
              updatedAt: (data.updatedAt as Timestamp).toDate(),
            } as MedicationRecord;
          });

          set({
            isLoading: false,
            records,
            error: null,
          });
        } catch (error: any) {
          console.error('Error fetching records:', error);
          set({
            isLoading: false,
            error: error.message || '加载服药记录失败',
          });
        }
      },

      // 添加用药记录
      addRecord: async (
        familyId: string,
        userId: string,
        scheduleId: string,
        medicineId: string,
        date: string,
        time: string,
        dosage: string,
        mealLabel?: MealLabel
      ) => {
        set({ isLoading: true, error: null });

        try {
          const newRecord: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'> = {
            familyId,
            userId,
            scheduleId,
            medicineId,
            date,
            time,
            mealLabel,
            dosage,
            status: 'scheduled',
          };

          const recordRef = doc(collection(db, 'records'));
          await setDoc(recordRef, newRecord);
          const recordId = recordRef.id;

          const record: MedicationRecord = {
            ...newRecord,
            id: recordId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            isLoading: false,
            records: [record, ...state.records],
            error: null,
          }));

          return record;
        } catch (error: any) {
          console.error('Error adding record:', error);
          set({
            isLoading: false,
            error: error.message || '添加记录失败',
          });
          throw error;
        }
      },

      // 辅助函数
      getRepeatLabel: (type: RepeatType) => REPEAT_LABELS[type],
      getMealLabel: (label: MealLabel) => MEAL_LABELS[label],
      getFrequencyLabel: (type: FrequencyType) => FREQUENCY_LABELS[type],
      clearError: () => set({ error: null }),
      setUser: (user: User | null) => set({ user }),
    })
  );

// 辅助函数
export const getRepeatLabel = (type: RepeatType): string =>
  useScheduleStore.getState().getRepeatLabel(type);
export const getMealLabel = (label: MealLabel): string =>
  useScheduleStore.getState().getMealLabel(label);
export const getFrequencyLabel = (type: FrequencyType): string =>
  useScheduleStore.getState().getFrequencyLabel(type);
