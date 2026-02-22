import { format, parseISO, differenceInMinutes, isToday, isFuture, isPast } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string, pattern = 'yyyy-MM-dd') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: zhCN });
};

/**
 * 格式化时间
 */
export const formatTime = (time: string) => {
  // time格式: HH:mm
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'HH:mm', { locale: zhCN });
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (dateTime: Date | string) => {
  const d = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

/**
 * 获取友好的时间差显示
 */
export const getTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInMinutes = differenceInMinutes(now, d);

  if (diffInMinutes < 1) {
    return '刚刚';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInMinutes < 1440) { // 24小时
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}小时前`;
  } else if (diffInMinutes < 4320) { // 3天
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}天前`;
  } else {
    return formatDate(d, 'MM-dd');
  }
};

/**
 * 计算倒计时
 */
export const getCountdown = (targetTime: string): string => {
  const [hours, minutes] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (isPast(target)) {
    return '已过期';
  }

  const diff = target.getTime() - now.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`;
  } else {
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}小时${m}分钟`;
  }
};

/**
 * 判断时间是否在指定分钟数内
 */
export const isWithinMinutes = (targetTime: string, minutes: number): boolean => {
  const [hours, mins] = targetTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, mins, 0, 0);

  const diff = Math.abs(differenceInMinutes(now, target));
  return diff <= minutes;
};

/**
 * 判断是否是今天
 */
export const isDateToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
};

/**
 * 判断是否是未来时间
 */
export const isDateFuture = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(d);
};

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆）
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证密码强度
 */
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 1;
  else suggestions.push('密码长度至少8位');

  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('包含小写字母');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('包含大写字母');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('包含数字');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else suggestions.push('包含特殊字符');

  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 3) strength = 'medium';
  else strength = 'strong';

  return { strength, score, suggestions };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 深拷贝
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 生成随机字符串
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 生成UUID
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 隐藏手机号中间部分
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 隐藏邮箱中间部分
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return email;
  const maskedName = name.substring(0, 2) + '***' + name.substring(name.length - 1);
  return maskedName + '@' + domain;
};

/**
 * 计算依从率
 */
export const calculateAdherenceRate = (
  taken: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((taken / total) * 100);
};

/**
 * 获取依从率等级
 */
export const getAdherenceLevel = (rate: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  label: string;
} => {
  if (rate >= 90) {
    return { level: 'excellent', color: '#66BB6A', label: '优秀' };
  } else if (rate >= 70) {
    return { level: 'good', color: '#FFA726', label: '良好' };
  } else if (rate >= 50) {
    return { level: 'fair', color: '#FF9800', label: '一般' };
  } else {
    return { level: 'poor', color: '#EF5350', label: '较差' };
  }
};

/**
 * 检查库存是否低
 */
export const isLowStock = (stock: number, threshold: number = 5): boolean => {
  return stock <= threshold;
};

/**
 * 获取库存状态
 */
export const getStockStatus = (
  stock: number,
  threshold: number = 5
): { status: 'normal' | 'low' | 'empty'; color: string; label: string } => {
  if (stock === 0) {
    return { status: 'empty', color: '#EF5350', label: '已缺货' };
  } else if (isLowStock(stock, threshold)) {
    return { status: 'low', color: '#FFA726', label: '库存不足' };
  } else {
    return { status: 'normal', color: '#66BB6A', label: '库存充足' };
  }
};

/**
 * 格式化药盒格号
 */
export const formatSlotNumber = (slot: number): string => {
  return `格${slot}`;
};

/**
 * 验证药盒格号（1-8）
 */
export const isValidSlotNumber = (slot: number): boolean => {
  return slot >= 1 && slot <= 8;
};

/**
 * 比较两个日期时间是否相同
 */
export const isSameDateTime = (
  date1: Date | string,
  date2: Date | string
): boolean => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1.getTime() === d2.getTime();
};

/**
 * 格式化剂量显示
 * 智能处理 dosage 和 unit，避免出现「1片片」这样的重复
 * 
 * @param dosage - 剂量，可能是数字或带单位的字符串，如 "1"、"1片"、"2粒"
 * @param unit - 单位，如 "片"、"粒"、"ml"
 * @returns 格式化后的显示字符串，如 "1片"、"2粒"
 * 
 * @example
 * formatDosage("1", "片") // => "1片"
 * formatDosage("1片", "片") // => "1片"
 * formatDosage("2粒", "粒") // => "2粒"
 * formatDosage("5ml", "ml") // => "5ml"
 */
export const formatDosage = (dosage: string | undefined, unit: string | undefined): string => {
  if (!dosage) {
    return unit ? `1${unit}` : '1片';
  }

  const trimmedDosage = dosage.trim();
  
  const dosageMatch = trimmedDosage.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (dosageMatch) {
    const number = dosageMatch[1];
    const existingUnit = dosageMatch[2].trim();
    
    if (existingUnit) {
      return `${number}${existingUnit}`;
    }
    
    if (unit) {
      return `${number}${unit}`;
    }
    
    return number;
  }
  
  if (unit) {
    return `${trimmedDosage}${unit}`;
  }
  
  return trimmedDosage;
};

/**
 * 格式化剂量乘以单位显示（用于计划列表等）
 * 例如：formatDosageWithUnit("1", "片") => "1 × 片"
 * 例如：formatDosageWithUnit("1片", "片") => "1片"（智能去重）
 */
export const formatDosageWithUnit = (dosage: string | undefined, unit: string | undefined): string => {
  if (!dosage) {
    return unit ? `1 × ${unit}` : '1 × 片';
  }

  const trimmedDosage = dosage.trim();
  const dosageMatch = trimmedDosage.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (dosageMatch) {
    const number = dosageMatch[1];
    const existingUnit = dosageMatch[2].trim();
    
    if (existingUnit) {
      return trimmedDosage;
    }
    
    if (unit) {
      return `${number} × ${unit}`;
    }
    
    return number;
  }
  
  return trimmedDosage;
};
