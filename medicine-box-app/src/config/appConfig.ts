/**
 * 应用全局配置
 * 统一管理开发/生产环境切换
 */

export const APP_CONFIG = {
  DEV_MODE: true,
  API_TIMEOUT: 30000,
  LOW_STOCK_THRESHOLD: 5,
  BOX_SLOT_COUNT: 8,
} as const;

export default APP_CONFIG;
