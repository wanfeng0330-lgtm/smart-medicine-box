/**
 * 药品类型定义（完整版）
 */

/**
 * 用药禁忌标签
 */
export type ContraindicationType =
  | 'with_water' // 需要用送服
  | 'avoid_alcohol' // 服药期间禁酒
  | 'avoid_driving' // 服药后禁止驾车
  | 'empty_stomach' // 空腹服用
  | 'after_meal' // 饭后服用
  | 'avoid_sunlight' // 服药后避免阳光
  | 'other'; // 自定义

/**
 * 用药禁忌标签常量
 */
export const CONTRAINDICATION_LABELS: Record<ContraindicationType, string> = {
  with_water: '用药时需用温水送服',
  avoid_alcohol: '服药期间禁止饮酒',
  avoid_driving: '服药后请勿驾驶',
  empty_stomach: '请空腹服用',
  after_meal: '请饭后服用',
  avoid_sunlight: '服药后避免阳光直射',
  other: '其他注意事项',
};

/**
 * 药品信息
 */
export interface Medicine {
  id: string; // Firestore document ID
  familyId: string; // 家庭组ID (foreign key)
  name: string; // 药品名称
  description?: string; // 药品描述（可选）
  barcode?: string; // 条形码/QR码
  dosage: string; // 剂量（如：1片、5ml）
  stock: number; // 当前库存数量
  unit?: string; // 单位（片、粒、ml、mg等）
  boxSlot?: number; // 分配的药盒格编号（1-8号）
  prescriptionUrl?: string; // 处方照片URL（Firebase Storage）
  contraindications: ContraindicationType[]; // 用药禁忌标签
  notes?: string; // 用户备注
  expiryDate?: string; // 有效期（YYYY-MM-DD）
  manufacturer?: string; // 生产厂家
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 处方信息
 */
export interface Prescription {
  id: string;
  medicineId: string; // 关联的药品ID
  imageUrl: string; // 处方照片URL
  uploadedAt: Date;
  doctorName?: string; // 医生姓名（可选）
  hospitalName?: string; // 医院名称（可选）
}

/**
 * OCR识别结果（临时）
 */
export interface OCRResult {
  medicineName?: string;
  dosage?: string;
  manufacturer?: string;
  confidence: number; // 识别置信度 0-1
}

/**
 * 条码扫描结果
 */
export interface BarcodeScanResult {
  barcode: string;
  medicineName?: string;
  description?: string;
  imageUrl?: string;
  found: boolean;
}
