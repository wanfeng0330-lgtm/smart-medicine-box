import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * BLE设备信息
 */
export interface BLEDevice {
  id: string;
  name: string | null;
  macAddress?: string;
  rssi: number;
  isConnectable: boolean;
}

/**
 * 药盒格状态
 */
export interface BoxSlotStatus {
  slotNumber: number; // 1-8
  medicineId?: string | null;
  isUnlocked: boolean;
  lastUnlockedAt?: Date | null;
}

/**
 * 设备状态
 */
export interface DeviceStatus {
  id: string;
  batteryLevel: number; // 0-100
  isOnline: boolean;
  lastConnectedAt: Date;
  slots: BoxSlotStatus[];
}

/**
 * 蓝牙状态
 */
interface BLEState {
  // 状态
  isLoading: boolean;
  isScanning: boolean;
  discoveredDevices: BLEDevice[];
  connectedDevice: BLEDevice | null;
  deviceStatus: DeviceStatus | null;
  error: string | null;
  hasPermissions: boolean;

  // Actions - 权限和初始化
  requestPermissions: () => Promise<boolean>;

  // Actions - 扫描和连接
  startScan: (serviceUUID?: string) => Promise<void>;
  stopScan: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: () => Promise<void>;

  // Actions - 设备控制
  openBoxSlot: (slotNumber: number) => Promise<void>;
  requestDeviceStatus: () => Promise<DeviceStatus | null>;

  // Actions - 状态管理
  updateDeviceStatus: (status: DeviceStatus) => void;
  clearError: () => void;
}

/**
 * BLE Store - 简化实现（避免react-native-ble-plx类型问题）
 */
export const useBLEStore = create<BLEState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      isScanning: false,
      discoveredDevices: [],
      connectedDevice: null,
      deviceStatus: null,
      error: null,
      hasPermissions: false,

      // 请求BLE权限
      requestPermissions: async () => {
        set({ isLoading: true, error: null });

        try {
          // Android请求权限
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: '位置权限',
                message: '需要位置权限来扫描蓝牙设备',
                buttonNeutral: '稍后提醒',
                buttonNegative: '拒绝',
                buttonPositive: '允许',
              }
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              set({
                isLoading: false,
                error: '需要位置权限才能使用蓝牙功能',
                hasPermissions: false,
              });
              return false;
            }
          }

          set({ isLoading: false, hasPermissions: true, error: null });
          return true;
        } catch (error: any) {
          console.error('Error requesting BLE permissions:', error);
          set({
            isLoading: false,
            error: error.message || '请求权限失败',
            hasPermissions: false,
          });
          return false;
        }
      },

      // 开始扫描（模拟实现）
      startScan: async (serviceUUID?) => {
        const { hasPermissions } = get();
        if (!hasPermissions) {
          set({ error: '缺少蓝牙权限' });
          return;
        }

        set({ isScanning: true, discoveredDevices: [], error: null });

        // 模拟扫描延迟
        setTimeout(() => {
          // 模拟发现的设备
          const mockDevices: BLEDevice[] = [
            {
              id: 'device_001',
              name: '智能药盒-001',
              rssi: -60,
              isConnectable: true,
            },
            {
              id: 'device_002',
              name: '智能药盒-002',
              rssi: -45,
              isConnectable: true,
            },
          ];

          set({
            isScanning: false,
            discoveredDevices: mockDevices,
          });

          console.log('Scan completed, found devices:', mockDevices);
        }, 3000);
      },

      // 停止扫描
      stopScan: async () => {
        set({ isScanning: false });
      },

      // 连接到设备（模拟实现）
      connectToDevice: async (deviceId) => {
        const { discoveredDevices } = get();

        set({ isLoading: true, error: null });

        try {
          const device = discoveredDevices.find((d) => d.id === deviceId);
          if (!device) {
            set({ isLoading: false, error: '未找到设备' });
            return;
          }

          // 模拟连接延迟
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // 模拟初始设备状态
          const initialStatus: DeviceStatus = {
            id: device.id,
            batteryLevel: 85,
            isOnline: true,
            lastConnectedAt: new Date(),
            slots: Array.from({ length: 8 }, (_, i) => ({
              slotNumber: i + 1,
              medicineId: null,
              isUnlocked: false,
            })),
          };

          set({
            isLoading: false,
            connectedDevice: device,
            deviceStatus: initialStatus,
            error: null,
          });

          console.log('Connected to device:', device.name);
        } catch (error: any) {
          console.error('Error connecting to device:', error);
          set({
            isLoading: false,
            error: error.message || '连接设备失败',
          });
        }
      },

      // 断开设备连接
      disconnectDevice: async () => {
        set({ isLoading: true });

        try {
          // 模拟断开延迟
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set({
            isLoading: false,
            connectedDevice: null,
            deviceStatus: null,
          });

          console.log('Disconnected from device');
        } catch (error: any) {
          console.error('Error disconnecting:', error);
          set({ isLoading: false });
        }
      },

      // 打开药盒格（模拟实现）
      openBoxSlot: async (slotNumber: number) => {
        const { deviceStatus } = get();

        if (!deviceStatus) {
          set({ error: '未连接设备' });
          throw new Error('未连接设备');
        }

        // 验证槽位编号
        if (slotNumber < 1 || slotNumber > 8) {
          set({ error: '无效的槽位编号' });
          throw new Error('无效的槽位编号');
        }

        set({ isLoading: true });

        try {
          // 模拟开格延迟
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 更新设备状态
          const updatedSlots = deviceStatus.slots.map((slot) =>
            slot.slotNumber === slotNumber
              ? { ...slot, isUnlocked: true, lastUnlockedAt: new Date() }
              : slot
          );

          set((state) => ({
            isLoading: false,
            deviceStatus: state.deviceStatus
              ? { ...state.deviceStatus, slots: updatedSlots }
              : null,
          }));

          console.log(`Opened box slot ${slotNumber}`);
        } catch (error: any) {
          console.error('Error opening box slot:', error);
          set({ error: error.message || '开格失败' });
          throw error;
        }
      },

      // 请求设备状态（模拟实现）
      requestDeviceStatus: async (): Promise<DeviceStatus | null> => {
        const { deviceStatus } = get();

        if (!deviceStatus) {
          return null;
        }

        set({ isLoading: true });

        try {
          // 模拟查询延迟
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 模拟返回当前状态
          set({ isLoading: false });
          return deviceStatus;
        } catch (error: any) {
          console.error('Error requesting device status:', error);
          set({ isLoading: false });
          return null;
        }
      },

      // 更新设备状态
      updateDeviceStatus: (status: DeviceStatus) => {
        set({ deviceStatus: status });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ble-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 不持久化连接状态
      partialize: (state) => ({
        hasPermissions: Boolean(state.hasPermissions),
      }),
    }
  )
);

/**
 * 辅助函数 - 检查是否连接到设备
 */
export const isConnectedToDevice = (): boolean => {
  const { connectedDevice } = useBLEStore.getState();
  return connectedDevice !== null;
};

/**
 * 辅助函数 - 获取电池电量颜色
 */
export const getBatteryColor = (level: number): string => {
  if (level > 60) return '#66BB6A'; // 绿色
  if (level > 20) return '#FFA726'; // 橙色
  return '#EF5350'; // 红色
};
