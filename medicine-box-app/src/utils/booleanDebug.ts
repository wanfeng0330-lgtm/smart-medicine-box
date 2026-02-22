import { LogBox } from 'react-native';

/**
 * 布尔值类型调试工具
 * 用于检测运行时传递给原生组件的非法布尔值
 */

// 存储原始的console.error
const originalConsoleError = console.error;

// 监听所有错误
export const setupBooleanDebug = () => {
  // 拦截console.error
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // 检测布尔值转换错误
    if (message.includes('Boolean') || message.includes('boolean') || 
        message.includes('String cannot be cast')) {
      console.log('🔴 [BOOLEAN DEBUG] 检测到布尔值转换错误:');
      console.log('🔴 错误详情:', ...args);
      console.log('🔴 调用栈:', new Error().stack);
    }
    
    originalConsoleError.apply(console, args);
  };

  // 监听未捕获的异常
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const message = error?.message || '';
    
    if (message.includes('Boolean') || message.includes('String cannot be cast') ||
        message.includes('java.lang.ClassCastException')) {
      console.log('🔴🔴🔴 [BOOLEAN DEBUG] 崩溃根因:');
      console.log('🔴 错误类型:', error.name);
      console.log('🔴 错误消息:', error.message);
      console.log('🔴 堆栈:', error.stack);
      console.log('🔴 是否致命:', isFatal);
      
      // 打印组件树信息
      console.log('🔴 提示: 请检查上述堆栈中涉及的组件的布尔属性');
    }
    
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  console.log('✅ [BOOLEAN DEBUG] 调试工具已启用');
};

/**
 * 验证布尔值是否合法
 */
export const validateBoolean = (value: any, propName: string, componentName: string): boolean => {
  if (typeof value === 'string') {
    console.log(`🟡 [BOOLEAN WARNING] ${componentName}.${propName} 收到字符串值: "${value}"`);
    return false;
  }
  return true;
};

/**
 * 安全的布尔值转换
 */
export const safeBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    console.log(`🟡 [BOOLEAN FIX] 将字符串 "${value}" 转换为布尔值`);
    return value === 'true';
  }
  return !!value;
};

/**
 * 打印所有AsyncStorage数据（调试用）
 */
export const debugAsyncStorage = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 [DEBUG] AsyncStorage Keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`📦 [DEBUG] ${key}:`, JSON.stringify(parsed, null, 2));
          
          // 检查布尔值问题
          const checkForBooleans = (obj: any, path: string = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            for (const k of Object.keys(obj)) {
              const v = obj[k];
              const currentPath = path ? `${path}.${k}` : k;
              
              if (v === 'true' || v === 'false') {
                console.log(`🟡 [BOOLEAN ISSUE] 发现字符串布尔值: ${currentPath} = "${v}"`);
              } else if (typeof v === 'object') {
                checkForBooleans(v, currentPath);
              }
            }
          };
          
          checkForBooleans(parsed);
        } catch (e) {
          console.log(`📦 [DEBUG] ${key}: (无法解析)`, value.substring(0, 100));
        }
      }
    }
  } catch (error) {
    console.error('📦 [DEBUG] 读取AsyncStorage失败:', error);
  }
};

export default {
  setupBooleanDebug,
  validateBoolean,
  safeBoolean,
  debugAsyncStorage,
};
