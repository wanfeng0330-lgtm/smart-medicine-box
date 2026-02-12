/**
 * 用药计划类型定义（完整版）
 */

/**
 * 重复类型
 */
export type RepeatType =
  | 'daily' // 每天
  | 'weekly' // 每周
  | 'monthly' // 每月
  | 'course' // 疗程（指定起止日期）
  | 'custom'; // 自定义

/**
 * 用餐标签
 */
export type MealLabel = 'before_meal' | 'after_meal' | 'with_meal' | 'no_meal';

/**
 * 用药频率（每天几次）
 */
export type FrequencyType = 'once' | 'twice' | 'three_times' | 'four_times' | 'custom';

/**
 * 重复类型标签常量
 */
export const REPEAT_LABELS: Record<RepeatType, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  course: '疗程',
  custom: '自定义',
};

/**
 * 用餐标签常量
 */
export const MEAL_LABELS: Record<MealLabel, string> = {
  before_meal: '饭前',
  after_meal: '饭后',
  with_meal: '饭后即刻',
  no_meal: '不限',
};

/**
 * 频率类型标签常量
 */
export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  once: '每天1次',
  twice: '每天2次',
  three_times: '每天3次',
  four_times: '每天4次',
  custom: '自定义',
};

/**
 * 每日用药时间
 */
export interface DailyTime {
  hour: number; // 0-23
  minute: number; // 0-59
  mealLabel?: MealLabel; // 用餐标签
  dosage?: string; // 该时段的剂量（可覆盖默认剂量）
}

/**
 * 用药计划
 */
export interface Schedule {
  id: string; // Firestore document ID
  familyId: string; // 家庭组ID
  medicineId: string; // 药品ID
  medicineName: string; // 药品名称（冗余字段，方便查询）
  medicineDosage: string; // 药品默认剂量
  medicineUnit: string; // 药品单位

  // 重复设置
  repeatType: RepeatType; // 重复类型
  repeatValue?: number; // 每N天/周/月
  weekdays?: number[]; // 每周几 (0-6, 0=周日)
  startDate: string; // 开始日期 (YYYY-MM-DD)
  endDate?: string; // 结束日期 (YYYY-MM-DD)

  // 每日时间设置
  frequency: FrequencyType; // 每天几次
  dailyTimes: DailyTime[]; // 每日服药时间列表

  // 备注
  notes?: string;

  // 标志
  isActive: boolean; // 是否激活

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用药状态
 */
export type MedicationStatus = 'scheduled' | 'taken' | 'missed' | 'skipped';

/**
 * 用药记录（每日实际服药记录）
 */
export interface MedicationRecord {
  id: string; // Firestore document ID
  familyId: string; // 家庭组ID
  userId: string; // 用户ID
  scheduleId: string; // 用药计划ID
  medicineId: string; // 药品ID
  date: string; // 日期 (YYYY-MM-DD)
  time: string; // 时间 (HH:mm)
  mealLabel?: MealLabel; // 用餐标签
  dosage: string; // 实际服药剂量

  // 状态
  status: MedicationStatus; // 服药状态
  takenAt?: Date; // 实际服药时间
  skippedAt?: Date; // 跳过记录时间
  notes?: string; // 备注

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 今日用药计划项
 */
export interface TodayMedication {
  scheduleId: string;
  medicineId: string;
  medicineName: string;
  medicineDosage: string;
  medicineUnit: string;
  boxSlot?: number; // 药盒格号
  time: string; // HH:mm
  mealLabel?: MealLabel;
  dosage?: string;
  record?: MedicationRecord; // 已有的服药记录
  status: MedicationStatus; // 当前状态
}

/**
 * 疗程统计
 */
export interface CourseStatistics {
  totalDays: number;
  completedDays: number;
  missedDays: number;
  complianceRate: number; // 服药遵从率 (0-100)
}
