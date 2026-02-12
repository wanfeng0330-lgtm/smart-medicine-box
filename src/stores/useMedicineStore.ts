import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

import { db, storage } from '@/config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import {
  Medicine,
  Prescription,
  OCRResult,
  BarcodeScanResult,
  CONTRAINDICATION_LABELS,
  ConstraindicationType,
} from '@/types/medicine';
import { User } from '@/types/user';

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 药品状态
 */
interface MedicineState {
  // 状态
  isLoading: boolean;
  medicines: Medicine[];
  prescription: Prescription | null;
  error: string | null;
  user: User | null;

  // Actions - 药品管理
  fetchMedicines: (familyId: string) => Promise<void>;
  addMedicine: (
    name: string,
    description: string,
    barcode?: string,
    dosage: string,
    stock: number,
    unit?: string,
    contraindications: ConstraindicationType[],
    notes?: string,
    expiryDate?: string,
    manufacturer?: string
  ) => Promise<Medicine>;
  updateMedicine: (
    id: string,
    data: Partial<Medicine>
  ) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;

  // Actions - 处方管理
  uploadPrescription: (
    medicineId: string,
    imageUri: string,
    doctorName?: string,
    hospitalName?: string
  ) => Promise<Prescription>;
  deletePrescription: (prescriptionId: string) => Promise<void>;

  // Actions - 条码扫描
  scanBarcode: (barcode: string) => Promise<BarcodeScanResult>;

  // Actions - OCR识别
  recognizeMedicine: (imageUri: string) => Promise<OCRResult>;

  // Actions - 药盒格管理
  assignBoxSlot: (medicineId: string, slotNumber: number) => Promise<void>;
  unassignBoxSlot: (medicineId: string) => Promise<void>;

  // 辅助
  getLowStockMedicines: (threshold?: number) => Medicine[];
  clearError: () => void;
  setUser: (user: User | null) => void;
}

/**
 * Medicine Store
 */
export const useMedicineStore = create<MedicineState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      medicines: [],
      prescription: null,
      error: null,
      user: null,

      // 获取药品列表（按家庭组）
      fetchMedicines: async (familyId) => {
        set({ isLoading: true, error: null });

        try {
          const medicinesQuery = query(
            collection(db, 'medicines'),
            where('familyId', '==', familyId),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(medicinesQuery);
          const medicines = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: (data.createdAt as Timestamp).toDate(),
              updatedAt: (data.updatedAt as Timestamp).toDate(),
            } as Medicine;
          });

          set({
            isLoading: false,
            medicines,
            error: null,
          });
        } catch (error: any) {
          console.error('Error fetching medicines:', error);
          set({
            isLoading: false,
            error: error.message || '加载药品失败',
          });
        }
      },

      // 添加药品
      addMedicine: async (
        name,
        description,
        barcode,
        dosage,
        stock,
        unit = '片',
        contraindications,
        notes,
        expiryDate,
        manufacturer
      ) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '请先加入家庭组' });
          throw new Error('未加入家庭组');
        }

        set({ isLoading: true, error: null });

        try {
          const newMedicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'> = {
            familyId: user.familyId,
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

          const medicineRef = doc(collection(db, 'medicines'));
          await setDoc(medicineRef, newMedicine);
          const medicineId = medicineRef.id;

          const medicine: Medicine = {
            ...newMedicine,
            id: medicineId,
          };

          set((state) => ({
            isLoading: false,
            medicines: [medicine, ...state.medicines],
            error: null,
          }));

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

      // 更新药品
      updateMedicine: async (id, data) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          const medicineRef = doc(db, 'medicines', id);

          const updateData = {
            ...data,
            updatedAt: new Date(),
          };

          await updateDoc(medicineRef, updateData);

          set((state) => ({
            isLoading: false,
            medicines: state.medicines.map((m) =>
              m.id === id ? { ...m, ...data, updatedAt: new Date() } : m
            ),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error updating medicine:', error);
          set({
            isLoading: false,
            error: error.message || '更新药品失败',
          });
          throw error;
        }
      },

      // 删除药品
      deleteMedicine: async (id) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          // 删除 Firestore文档
          await deleteDoc(doc(db, 'medicines', id));

          // 如果有处方照片，删除Storage中的文件
          const medicine = get().medicines.find((m) => m.id === id);
          if (medicine?.prescriptionUrl) {
            try {
              // 从URL中提取文件路径
              const urlParts = new URL(medicine.prescriptionUrl);
              const pathParts = urlRef(urlParts.pathname);
              const storageRef = ref(storage, pathParts);
              await deleteObject(storageRef);
            } catch (error) {
              console.error('Error deleting prescription from storage:', error);
              // 不阻止药品删除，静默失败
            }
          }

          set((state) => ({
            isLoading: false,
            medicines: state.medicines.filter((m) => m.id !== id),
            error: null,
          }));
        } catch (error: any) {
          console.error('Error deleting medicine:', error);
          set({
            isLoading: false,
            error: error.message || '删除药品失败',
          });
          throw error;
        }
      },

      // 上传处方照片
      uploadPrescription: async (
        medicineId,
        imageUri,
        doctorName,
        hospitalName
      ) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          // 生成文件路径: prescriptions/medicineId/timestamp.jpg
          const fileName = `prescription_${Date.now()}.jpg`;
          const storagePath = `prescriptions/${user.familyId}/${medicineId}/${fileName}`;

          // 将URI转换为Blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // 上传到Firebase Storage
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, blob);

          // �回下载URL
          const downloadUrl = await getDownloadURL(storageRef);

          // 创建处方记录
          const prescriptionData = {
            medicineId,
            imageUrl: downloadUrl,
            uploadedAt: new Date(),
            doctorName: doctorName,
            hospitalName: hospitalName,
          };

          const prescriptionRef = doc(collection(db, 'prescriptions'));
          await setDoc(prescriptionRef, prescriptionData);

          const prescription: Prescription = {
            ...prescriptionData,
            id: prescriptionRef.id,
          };

          set((state) => ({
            isLoading: false,
            prescription,
            error: null,
          }));

          return prescription;
        } catch (error: any) {
          console.error('Error uploading prescription:', error);
          set({
            isLoading: false,
            error: error.message || '上传处方失败',
          });
          throw error;
        }
      },

      // 删除处方
      deletePrescription: async (prescriptionId: string) => {
        set({ isLoading: true, error: null });

        try {
          // 获取处方信息
          const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
          const prescriptionDoc = await getDoc(prescriptionRef);

          if (!prescriptionDoc.exists()) {
            set({ isLoading: false, error: '处方不存在' });
            return;
          }

          const prescription = prescriptionDoc.data() as Prescription;

          // 删除Storage中的文件
          if (prescription.imageUrl) {
            try {
              const urlParts = parseUrl(prescription.imageUrl);
              const storageRef = ref(storage, urlParts.pathname);
              await deleteObject(storageRef);
            } catch (error) {
              console.error('Error deleting image from storage:', error);
              // 不阻止删除，静默失败
            }
          }

          // 删除Firestore文档
          await deleteDoc(prescriptionRef);

          set({
            isLoading: false,
            prescription: null,
            error: null,
          });
        } catch (error: any) {
          console.error('Error deleting prescription:', error);
          set({
            isLoading: false,
            error: error.message || '删除处方失败',
          });
        }
      },

      // 条码扫描（占位实现）
      scanBarcode: async (barcode: string): Promise<BarcodeScanResult> => {
        // TODO: 集成实际的条码数据库
        // 这里返回占位数据

        set({ isLoading: true, error: null });

        try {
          // 模拟查询（实际应从数据库查询）
          const found = false;

          const result: BarcodeScanResult = {
            barcode: barcode.trim(),
            medicineName: found ? '感冒灵颗粒' : undefined,
            description: found ? '复方制剂，用于感冒引起的发热' : undefined,
            found,
          };

          set({ isLoading: false, error: null });

          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '条码扫描失败',
          });
          throw error;
        }
      },

      // OCR识别（占位实现）
      recognizeMedicine: async (imageUri: string): Promise<OCRResult> => {
        // TODO: 集成实际的OCR API（如Google ML Kit或第三方服务）
        // 这里返回占位数据

        set({ isLoading: true, error: null });

        try {
          // 模拟OCR返回（实际应调用OCR API）
          const result: OCRResult = {
            medicineName: '感冒灵颗粒', // 占位数据
            dosage: '10g',
            manufacturer: '修正药业',
            confidence: 0.85,
          };

          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'OCR识别失败',
          });
          throw error;
        }
      },

      // 分配药盒格
      assignBoxSlot: async (medicineId: string, slotNumber: number) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          // 检查药格编号是否有效（1-8）
          if (slotNumber < 1 || slotNumber > 8) {
            set({ error: '药盒格编号必须在1-8之间' });
            throw new Error('药盒格编号无效');
          }

          // 检查该药格是否已被其他药品占用
          const occupiedMedicine = get().medicines.find(
            (m) => m.boxSlot === slotNumber
          );

          if (occupiedMedicine && occupiedMedicine.id !== medicineId) {
            // 先取消之前的分配
            await get().unassignBoxSlot(occupiedMedicine.id);
          }

          // 更新药品的药盒格
          await get().updateMedicine(medicineId, {
            boxSlot: slotNumber,
          });

          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '分配药盒格失败',
          });
          throw error;
        }
      },

      // 取消药盒格分配
      unassignBoxSlot: async (medicineId: string) => {
        const { user } = get();

        if (!user || !user.familyId) {
          set({ error: '用户未登录' });
          throw new Error('未登录');
        }

        set({ isLoading: true, error: null });

        try {
          await get().updateMedicine(medicineId, {
            boxSlot: null,
          });

          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '取消药盒格失败',
          });
          throw error;
        }
      },

      // 获取低库存药品
      getLowStockMedicines: async (threshold = 5): Promise<Medicine[]> => {
        const { medicines } = get();
        const lowStockMeds = medicines.filter((m) => m.stock < threshold);
        return lowStockMeds;
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 设置用户
      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'medicine-storage',
      storage: AsyncStorage,
      partialize: (state) => ({
        medicines: state.medicines,
        user: state.user,
      }),
    }
  )
);

/**
 * 辅助函数：解析URL路径
 */
function parseUrl(url: string): URL {
  return new URL(url);
}

/**
 * 辅助函数：获取用药禁忌标签文本
 */
export const getContraindicationLabels = (
  types: ConstraindicationType[]
): string[] => {
  return types.map((type) => CONTRAINDICATION_LABELS[type]);
};
