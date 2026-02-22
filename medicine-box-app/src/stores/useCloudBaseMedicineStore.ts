import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Medicine,
  ContraindicationType,
} from '@/types/medicine';
import APP_CONFIG from '@/config/appConfig';

const { DEV_MODE } = APP_CONFIG;

interface MedicineState {
  isLoading: boolean;
  medicines: Medicine[];
  error: string | null;
  currentFamilyId: string | null;

  setCurrentFamilyId: (familyId: string | null) => void;
  fetchMedicines: (familyId: string) => Promise<void>;
  addMedicine: (
    name: string,
    dosage: string,
    stock: number,
    description?: string,
    barcode?: string,
    unit?: string,
    contraindications?: ContraindicationType[],
    notes?: string,
    expiryDate?: string,
    manufacturer?: string
  ) => Promise<Medicine>;
  updateMedicine: (id: string, data: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  assignBoxSlot: (medicineId: string, slotNumber: number) => Promise<void>;
  unassignBoxSlot: (medicineId: string) => Promise<void>;
  getLowStockMedicines: (threshold?: number) => Medicine[];
  clearError: () => void;
}

export const useCloudBaseMedicineStore = create<MedicineState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      medicines: [],
      error: null,
      currentFamilyId: null,

      setCurrentFamilyId: (familyId) => set({ currentFamilyId: familyId }),

      fetchMedicines: async (familyId: string) => {
        set({ isLoading: true, error: null });
        try {
          if (DEV_MODE) {
            const stored = await AsyncStorage.getItem('dev_medicines');
            const medicines = stored ? JSON.parse(stored) : [];
            set({
              isLoading: false,
              medicines,
              currentFamilyId: familyId,
              error: null,
            });
            return;
          }
        } catch (error: any) {
          console.error('Error fetching medicines:', error);
          set({
            isLoading: false,
            error: error.message || '加载药品失败',
          });
        }
      },

      addMedicine: async (
        name,
        dosage,
        stock,
        description,
        barcode,
        unit = '片',
        contraindications,
        notes,
        expiryDate,
        manufacturer
      ) => {
        const { currentFamilyId } = get();

        if (!currentFamilyId) {
          set({ error: '请先加入家庭组' });
          throw new Error('未加入家庭组');
        }

        set({ isLoading: true, error: null });

        try {
          const medicineId = `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const medicine: Medicine = {
            id: medicineId,
            familyId: currentFamilyId,
            name: name.trim(),
            description: description?.trim(),
            barcode: barcode?.trim(),
            dosage: dosage.trim(),
            stock,
            unit,
            contraindications: contraindications || [],
            notes: notes?.trim(),
            expiryDate,
            manufacturer,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const newMedicines = [medicine, ...get().medicines];
          
          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_medicines', JSON.stringify(newMedicines));
          }

          set({
            isLoading: false,
            medicines: newMedicines,
            error: null,
          });

          return medicine;
        } catch (error: any) {
          console.error('Error adding medicine:', error);
          set({
            isLoading: false,
            error: error.message || '添加药品失败',
          });
          throw error;
        }
      },

      updateMedicine: async (id: string, data: Partial<Medicine>) => {
        const { currentFamilyId } = get();

        if (!currentFamilyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          const newMedicines = get().medicines.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date() } : m
          );

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_medicines', JSON.stringify(newMedicines));
          }

          set({
            isLoading: false,
            medicines: newMedicines,
            error: null,
          });
        } catch (error: any) {
          console.error('Error updating medicine:', error);
          set({
            isLoading: false,
            error: error.message || '更新药品失败',
          });
          throw error;
        }
      },

      deleteMedicine: async (id: string) => {
        const { currentFamilyId } = get();

        if (!currentFamilyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          const newMedicines = get().medicines.filter((m) => m.id !== id);

          if (DEV_MODE) {
            await AsyncStorage.setItem('dev_medicines', JSON.stringify(newMedicines));
          }

          set({
            isLoading: false,
            medicines: newMedicines,
            error: null,
          });
        } catch (error: any) {
          console.error('Error deleting medicine:', error);
          set({
            isLoading: false,
            error: error.message || '删除药品失败',
          });
          throw error;
        }
      },

      assignBoxSlot: async (medicineId: string, slotNumber: number) => {
        const { currentFamilyId } = get();

        if (!currentFamilyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          if (slotNumber < 1 || slotNumber > 8) {
            set({ error: '药盒格编号必须在1-8之间' });
            throw new Error('药盒格编号无效');
          }

          const occupiedMedicine = get().medicines.find(
            (m) => m.boxSlot === slotNumber && m.id !== medicineId
          );

          if (occupiedMedicine) {
            await get().updateMedicine(occupiedMedicine.id, { boxSlot: undefined });
          }

          await get().updateMedicine(medicineId, { boxSlot: slotNumber });

          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '分配药盒格失败',
          });
          throw error;
        }
      },

      unassignBoxSlot: async (medicineId: string) => {
        await get().updateMedicine(medicineId, { boxSlot: undefined });
      },

      getLowStockMedicines: (threshold = 5): Medicine[] => {
        const { medicines } = get();
        return medicines.filter((m) => m.stock < threshold);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cloudbase-medicine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        medicines: state.medicines,
        currentFamilyId: state.currentFamilyId,
      }),
    }
  )
);
