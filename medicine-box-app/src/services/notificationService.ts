import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { format } from 'date-fns';

/**
 * 通知服务
 * 使用expo-notifications实现本地提醒
 */

// 配置通知处理行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 请求通知权限
 */
export const requestNotificationPermissions = async ():
Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: '用药提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFA726',
    });

    await Notifications.setNotificationChannelAsync('medication-urgent', {
      name: '紧急提醒',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 100, 50, 100, 50, 100],
      lightColor: '#EF5350',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

/**
 * 计划用药通知
 */
export interface ScheduleNotificationParams {
  medicineName: string;
  dosage: string;
  unit: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  mealLabel?: string;
  medicineId: string;
  scheduleId: string;
  recordId?: string; // 如果已创建记录
  dailyTimeIndex?: number; // 每日时间点索引，用于去重
}

/**
 * 提醒类型
 */
export type ReminderType = '10min' | 'on-time' | '5min-late' | 'missed';

/**
 * 获取提醒配置
 */
const getReminderConfig = (type: ReminderType) => {
  switch (type) {
    case '10min':
      return {
        title: '提前提醒 - 10分钟后服药',
        body: '请准备用药',
        channelId: 'medication-reminders',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };
    case 'on-time':
      return {
        title: '服药时间到了！',
        body: '请按时服药',
        channelId: 'medication-urgent',
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    case '5min-late':
      return {
        title: '已过期5分钟',
        body: '请立即服药',
        channelId: 'medication-urgent',
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    case 'missed':
      return {
        title: '已错过服药时间',
        body: '请记录并尽快补服',
        channelId: 'medication-reminders',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      };
  }
};

/**
 * 安排服药提醒（在指定日期时间的通知）
 */
export const scheduleMedicationReminder = async (
  params: ScheduleNotificationParams,
  reminderType: ReminderType = 'on-time'
): Promise<string | null> => {
  try {
    const { date, time, medicineName, dosage, unit, mealLabel, dailyTimeIndex } = params;
    const config = getReminderConfig(reminderType);

    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.log(`Invalid time format: ${time}, skipping notification`);
      return null;
    }

    const triggerDate = new Date(date);
    if (isNaN(triggerDate.getTime())) {
      console.log(`Invalid date format: ${date}, skipping notification`);
      return null;
    }

    triggerDate.setHours(hours, minutes, 0, 0);

    switch (reminderType) {
      case '10min':
        triggerDate.setMinutes(triggerDate.getMinutes() - 10);
        break;
      case '5min-late':
        triggerDate.setMinutes(triggerDate.getMinutes() + 5);
        break;
      case 'missed':
        triggerDate.setMinutes(triggerDate.getMinutes() + 30);
        break;
    }

    const now = new Date();
    const timeDiff = triggerDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      console.log(`Trigger time has passed for ${medicineName} at ${triggerDate.toISOString()}, not scheduling`);
      return null;
    }

    if (timeDiff < 60000) {
      console.log(`Trigger time too close (< 1 min), skipping notification`);
      return null;
    }

    const body = formatNotificationBody(medicineName, dosage, unit, mealLabel);

    const uniqueId = `${params.scheduleId}_${dailyTimeIndex ?? 0}_${reminderType}_${date}`;
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: body,
        sound: true,
        vibrate: notificationVibrationPattern(reminderType),
        priority: config.priority,
        data: {
          medicineId: params.medicineId,
          scheduleId: params.scheduleId,
          recordId: params.recordId,
          type: reminderType,
          medicineName,
          uniqueId,
          dailyTimeIndex: dailyTimeIndex ?? 0,
        },
        categoryIdentifier: 'medication',
      },
      trigger: {
        date: triggerDate,
        channelId: config.channelId,
      },
    });

    console.log(`Scheduled ${reminderType} notification for ${medicineName} at ${triggerDate.toISOString()}, identifier: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * 安排每日提醒（重复通知）
 */
export const scheduleDailyReminder = async (
  params: ScheduleNotificationParams,
  reminderType: ReminderType = 'on-time'
): Promise<string | null> => {
  try {
    const { time, medicineName, dosage, unit, mealLabel, dailyTimeIndex } = params;
    const config = getReminderConfig(reminderType);

    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.log(`Invalid time format: ${time}, skipping daily notification`);
      return null;
    }

    const body = formatNotificationBody(medicineName, dosage, unit, mealLabel);

    const uniqueId = `${params.scheduleId}_${dailyTimeIndex ?? 0}_${reminderType}_daily`;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: body,
        sound: true,
        vibrate: notificationVibrationPattern(reminderType),
        priority: config.priority,
        data: {
          medicineId: params.medicineId,
          scheduleId: params.scheduleId,
          type: reminderType,
          medicineName,
          uniqueId,
          dailyTimeIndex: dailyTimeIndex ?? 0,
        },
        categoryIdentifier: 'medication-daily',
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
        channelId: config.channelId,
      },
    });

    console.log(`Scheduled daily ${reminderType} notification for ${medicineName} at ${time}, identifier: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling daily notification:', error);
    return null;
  }
};

/**
 * 取消通知
 */
export const cancelNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Cancelled notification: ${identifier}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * 取消所有与药品相关的通知
 */
export const cancelMedicationNotifications = async (
  medicineId: string | string[]
): Promise<void> => {
  try {
    const ids = Array.isArray(medicineId) ? medicineId : [medicineId];

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter((n) => {
      const data = n.content.data as any;
      return data?.medicineId && ids.includes(data.medicineId);
    });

    for (const notification of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`Cancelled ${toCancel.length} notifications for medicine(s)`);
  } catch (error) {
    console.error('Error cancelling medication notifications:', error);
  }
};

/**
 * 取消所有通知
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * 获取所有已安排的通知
 */
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * 设置通知分类（带动作按钮）
 */
export const setupNotificationCategories = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationCategoryAsync('medication', [
      {
        identifier: 'take',
        buttonTitle: '已服',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'skip',
        buttonTitle: '跳过',
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
        },
      },
    ]);
  }
};

/**
 * 监听通知响应
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * 监听通知接收
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * 发送即时通知（不延迟）
 */
export const sendInstantNotification = async (
  medicineName: string,
  dosage: string,
  unit: string,
  mealLabel?: string
): Promise<void> => {
  try {
    const body = formatNotificationBody(medicineName, dosage, unit, mealLabel);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '服药提醒',
        body: body,
        sound: true,
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending instant notification:', error);
  }
};

/**
 * 震动模式
 */
const notificationVibrationPattern = (type: ReminderType): number[] => {
  switch (type) {
    case '10min':
      return [0, 200, 200];
    case 'on-time':
      return [0, 300, 200, 300, 200, 300];
    case '5min-late':
      return [0, 500, 300, 500];
    case 'missed':
      return [0, 100, 100, 100, 100];
    default:
      return [0, 250, 250, 250];
  }
};

/**
 * 获取用餐标签
 */
const getMealLabel = (label: string): string => {
  const labels: Record<string, string> = {
    before_meal: '饭前',
    after_meal: '饭后',
    with_meal: '饭后即刻',
    no_meal: '不限',
  };
  return labels[label] || label;
};

/**
 * 格式化通知文案
 * 正确处理剂量单位，避免出现「1片片」这样的错误
 */
const formatNotificationBody = (
  medicineName: string,
  dosage: string,
  unit: string,
  mealLabel?: string
): string => {
  const cleanDosage = extractDosageNumber(dosage);
  const cleanUnit = extractUnit(unit);
  const formattedDosage = formatDosageDisplay(cleanDosage, cleanUnit);
  
  let body = `${medicineName} ${formattedDosage}`;
  if (mealLabel) {
    body += ` ${getMealLabel(mealLabel)}`;
  }
  return body;
};

/**
 * 从剂量字符串中提取数字部分
 * 例如: "1片" -> "1", "2粒" -> "2", "5ml" -> "5"
 */
const extractDosageNumber = (dosage: string): string => {
  if (!dosage) return '1';
  const match = dosage.match(/^(\d+(?:\.\d+)?)/);
  return match ? match[1] : dosage;
};

/**
 * 从单位字符串中提取纯单位（去除数字）
 * 例如: "片" -> "片", "1片" -> "片", "ml" -> "ml"
 */
const extractUnit = (unit: string): string => {
  if (!unit) return '片';
  const match = unit.match(/[^\d.]+/);
  return match ? match[0].trim() : unit;
};

/**
 * 格式化剂量显示
 * 例如: ("1", "片") -> "1片", ("2", "粒") -> "2粒"
 */
const formatDosageDisplay = (dosage: string, unit: string): string => {
  return `${dosage}${unit}`;
};

/**
 * 取消指定计划的所有通知
 */
export const cancelScheduleNotifications = async (scheduleId: string): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter((n) => {
      const data = n.content.data as any;
      return data?.scheduleId === scheduleId;
    });

    for (const notification of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`Cancelled ${toCancel.length} notifications for schedule ${scheduleId}`);
  } catch (error) {
    console.error('Error cancelling schedule notifications:', error);
  }
};
