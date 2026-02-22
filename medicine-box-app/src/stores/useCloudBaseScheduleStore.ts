import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Schedule,
  DailyTime,
  MedicationRecord,
  RepeatType,
  MealLabel,
  FrequencyType,
  TodayMedication,
  MedicationStatus,
} from '@/types/schedule';
import {
  scheduleMedicationReminder,
  scheduleDailyReminder,
  cancelMedicationNotifications,
  cancelScheduleNotifications,
  requestNotificationPermissions,
} from '@/services/notificationService';
import APP_CONFIG from '@/config/appConfig';

const { DEV_MODE } = APP_CONFIG;

interface ScheduleState {
  isLoading: boolean;
  schedules: Schedule[];
  records: MedicationRecord[];
  error: string | null;
  currentFamilyId: string | null;
  currentUserId: string | null;

  setCurrentFamilyId: (familyId: string | null) => void;
  setCurrentUserId: (userId: string | null) => void;
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
  getTodayMedications: (familyId: string, date: string) => Promise<TodayMedication[]>;
  markAsTaken: (recordId: string) => Promise<void>;
  skipMedication: (recordId: string, notes?: string) => Promise<void>;
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
  syncAllNotifications: () => Promise<void>;
  clearError: () => void;
}

const shouldExecuteOnDay = (schedule: Schedule, targetDate: string): boolean => {
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

const scheduleNotificationsForPlan = async (schedule: Schedule) => {
  try {
    await cancelScheduleNotifications(schedule.id);
    
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    for (let timeIndex = 0; timeIndex < schedule.dailyTimes.length; timeIndex++) {
      const time = schedule.dailyTimes[timeIndex];
      const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
      const mealLabel = time.mealLabel || undefined;
      const params = {
        medicineName: schedule.medicineName,
        dosage: time.dosage || schedule.medicineDosage,
        unit: schedule.medicineUnit,
        time: timeStr,
        date: today,
        mealLabel,
        medicineId: schedule.medicineId,
        scheduleId: schedule.id,
        dailyTimeIndex: timeIndex,
      };

      if (schedule.repeatType === 'daily') {
        await scheduleDailyReminder(params, 'on-time');
      } else {
        const today10min = await scheduleMedicationReminder(params, '10min');
        const todayOnTime = await scheduleMedicationReminder(params, 'on-time');
        
        console.log(`Scheduled reminders for ${schedule.medicineName} time ${timeStr}: 10min=${today10min}, on-time=${todayOnTime}`);
      }
    }

    console.log(`Scheduled notifications for ${schedule.medicineName} (${schedule.dailyTimes.length} time slots)`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

export const useCloudBaseScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      schedules: [],
      records: [],
      error: null,
      currentFamilyId: null,
      currentUserId: null,

      setCurrentFamilyId: (familyId) => set({ currentFamilyId: familyId }),
      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      fetchSchedules: async (familyId: string) => {
        set({ isLoading: true, error: null });

        try {
          if (DEV_MODE) {
            const stored = await AsyncStorage.getItem('dev_schedules');
            const schedules = stored ? JSON.parse(stored) : [];
            set({
              isLoading: false,
              schedules,
              currentFamilyId: familyId,
              error: null,
            });
            return;
          }
        } catch (error: any) {
          console.error('Error fetching schedules:', error);
          set({
            isLoading: false,
            error: error.message || '加载用药计划失败',
          });
        }
      },

      addSchedule: async (
        familyId,
        medicineId,
        medicineName,
        medicineDosage,
        medicineUnit,
        repeatType,
        startDate,
        frequency,
        dailyTimes,
        repeatValue,
        weekdays,
        endDate,
        notes
      ) => {
        set({ isLoading: true, error: null });

        try {
          const scheduleId = `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const schedule: Schedule = {
            id: scheduleId,
            familyId,
            medicineId,
            medicineName,
            medicineDosage,
            medicineUnit,
            repeatType,
            startDate,
            frequency,
            dailyTimes,
            repeatValue,
            weekdays,
            endDate,
            notes,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const newSchedules = [schedule, ...get().schedules];

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_schedules', JSON.stringify(newSchedules));
          }

          set((state) => ({
            isLoading: false,
            schedules: newSchedules,
            error: null,
          }));

          scheduleNotificationsForPlan(schedule);

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

      updateSchedule: async (id: string, data: Partial<Schedule>) => {
        set({ isLoading: true, error: null });

        try {
          const newSchedules = get().schedules.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date() } : s
          );

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_schedules', JSON.stringify(newSchedules));
          }

          set({
            isLoading: false,
            schedules: newSchedules,
            error: null,
          });
        } catch (error: any) {
          console.error('Error updating schedule:', error);
          set({
            isLoading: false,
            error: error.message || '更新用药计划失败',
          });
          throw error;
        }
      },

      deleteSchedule: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const schedule = get().schedules.find((s) => s.id === id);
          const newSchedules = get().schedules.filter((s) => s.id !== id);

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_schedules', JSON.stringify(newSchedules));
          }

          if (schedule) {
            await cancelMedicationNotifications(schedule.medicineId);
          }

          set({
            isLoading: false,
            schedules: newSchedules,
            error: null,
          });
        } catch (error: any) {
          console.error('Error deleting schedule:', error);
          set({
            isLoading: false,
            error: error.message || '删除用药计划失败',
          });
          throw error;
        }
      },

      toggleScheduleActive: async (id: string) => {
        const { schedules } = get();
        const schedule = schedules.find((s) => s.id === id);

        if (!schedule) {
          throw new Error('用药计划不存在');
        }

        const newIsActive = !schedule.isActive;
        
        await get().updateSchedule(id, { isActive: newIsActive });

        if (newIsActive) {
          const updatedSchedule = { ...schedule, isActive: true };
          scheduleNotificationsForPlan(updatedSchedule);
        } else {
          await cancelMedicationNotifications(schedule.medicineId);
        }
      },

      getTodayMedications: async (familyId: string, date: string): Promise<TodayMedication[]> => {
        const { schedules, records } = get();
        const medications: TodayMedication[] = [];

        const activeSchedules = schedules.filter(
          (s) => s.familyId === familyId && shouldExecuteOnDay(s, date)
        );

        for (const schedule of activeSchedules) {
          for (const time of schedule.dailyTimes) {
            const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
            
            const existingRecord = records.find(
              (r) =>
                r.scheduleId === schedule.id &&
                r.date === date &&
                r.time === timeStr
            );

            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            let status: MedicationStatus = 'scheduled';
            if (existingRecord) {
              status = existingRecord.status;
            } else if (timeStr < currentTime) {
              status = 'missed';
            }

            medications.push({
              scheduleId: schedule.id,
              medicineId: schedule.medicineId,
              medicineName: schedule.medicineName,
              medicineDosage: schedule.medicineDosage,
              medicineUnit: schedule.medicineUnit,
              time: timeStr,
              dosage: time.dosage,
              mealLabel: time.mealLabel,
              status,
              record: existingRecord,
            });
          }
        }

        medications.sort((a, b) => a.time.localeCompare(b.time));

        return medications;
      },

      markAsTaken: async (recordId: string) => {
        set({ isLoading: true, error: null });

        try {
          const newRecords = get().records.map((r) =>
            r.id === recordId
              ? { ...r, status: 'taken' as MedicationStatus, takenAt: new Date(), updatedAt: new Date() }
              : r
          );

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_records', JSON.stringify(newRecords));
          }

          set({
            isLoading: false,
            records: newRecords,
            error: null,
          });
        } catch (error: any) {
          console.error('Error marking as taken:', error);
          set({
            isLoading: false,
            error: error.message || '标记失败',
          });
          throw error;
        }
      },

      skipMedication: async (recordId: string, notes?: string) => {
        set({ isLoading: true, error: null });

        try {
          const newRecords = get().records.map((r) =>
            r.id === recordId
              ? { ...r, status: 'skipped' as MedicationStatus, notes, updatedAt: new Date() }
              : r
          );

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_records', JSON.stringify(newRecords));
          }

          set({
            isLoading: false,
            records: newRecords,
            error: null,
          });
        } catch (error: any) {
          console.error('Error skipping medication:', error);
          set({
            isLoading: false,
            error: error.message || '跳过失败',
          });
          throw error;
        }
      },

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
          const recordId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const record: MedicationRecord = {
            id: recordId,
            familyId,
            userId,
            scheduleId,
            medicineId,
            date,
            time,
            dosage,
            mealLabel,
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const newRecords = [record, ...get().records];

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_records', JSON.stringify(newRecords));
          }

          set({
            isLoading: false,
            records: newRecords,
            error: null,
          });

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

      syncAllNotifications: async () => {
        try {
          const { schedules } = get();
          const activeSchedules = schedules.filter((s) => s.isActive);
          
          const hasPermission = await requestNotificationPermissions();
          if (!hasPermission) {
            console.log('No notification permission');
            return;
          }

          for (const schedule of activeSchedules) {
            await scheduleNotificationsForPlan(schedule);
          }

          console.log(`Synced notifications for ${activeSchedules.length} active schedules`);
        } catch (error) {
          console.error('Error syncing notifications:', error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cloudbase-schedule-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        schedules: state.schedules,
        records: state.records,
        currentFamilyId: state.currentFamilyId,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
