import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  useTheme,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  requestNotificationPermissions,
  getScheduledNotifications,
  sendInstantNotification,
} from '@/services/notificationService';

/**
 * NotificationSettingsScreen - 通知设置界面
 * 适老化设计 - Soft/pastel风格
 */
export const NotificationSettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const theme = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ledEnabled, setLedEnabled] = useState(true);

  const [showTestDialog, setShowTestDialog] = useState(false);

  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadScheduledCount();
  }, []);

  const loadSettings = async () => {
    // 可以从AsyncStorage加载设置
    setNotificationsEnabled(true);
  };

  const loadScheduledCount = async () => {
    try {
      const notifications = await getScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      // 请求通知权限
      const granted = await requestNotificationPermissions();
      if (granted) {
        setNotificationsEnabled(true);
        Alert.alert('成功', '通知权限已开启');
      } else {
        Alert.alert('失败', '无法获取通知权限');
      }
    } else {
      setNotificationsEnabled(false);
      await Alert.alert('已关闭', '通知已禁用');
    }
  };

  const handleTestNotification = async () => {
    await sendInstantNotification('布洛芬', '1片', '', 'after_meal');
    setShowTestDialog(false);
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => {
    return (
      <Card style={styles.settingCard} elevation={0}>
        <Card.Content style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <Avatar.Icon
              size={48}
              icon={icon}
              style={styles.settingIcon}
              color={theme.colors.primary}
            />
            <View style={styles.settingText}>
              <Text variant="titleMedium" style={styles.settingTitle}>
                {title}
              </Text>
              <Text variant="bodyMedium" style={styles.settingDescription}>
                {description}
              </Text>
            </View>
          </View>

          <Switch
            value={value}
            onValueChange={onToggle}
            disabled={!notificationsEnabled}
            trackColor={{ false: '#BDBDBD', true: '#FFA726' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E0E0E0"
          />
        </Card.Content>
      </Card>
    );
  };

  const renderStatusCard = () => {
    return (
      <Card style={styles.statusCard} elevation={2}>
        <Card.Content style={styles.statusContent}>
          <Avatar.Icon
            size={64}
            icon={notificationsEnabled ? 'bell-ring' : 'bell-off'}
            style={styles.statusIcon}
          />
          <View style={styles.statusText}>
            <Text variant="headlineMedium" style={styles.statusTextMain}>
              {notificationsEnabled ? '通知已启用' : '通知已禁用'}
            </Text>
            <Text variant="bodyLarge" style={styles.statusSubtext}>
              当前有 {scheduledCount} 个计划提醒
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Toolbar
          title="通知设置"
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderStatusCard()}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          提醒设置
        </Text>

        {renderSettingItem(
          'bell',
          '用药提醒',
          '开启后会在服药时间提醒您',
          notificationsEnabled,
          handleEnableNotifications
        )}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          通知方式
        </Text>

        {renderSettingItem(
          'vibrate',
          '震动提醒',
          '服药时手机会震动',
          vibrationEnabled,
          setVibrationEnabled
        )}

        {renderSettingItem(
          'volume-high',
          '声音提醒',
          '服药时播放提示音',
          soundEnabled,
          setSoundEnabled
        )}

        {renderSettingItem(
          'led-on',
          'LED闪光',
          '服药时LED灯闪烁',
          ledEnabled,
          setLedEnabled
        )}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          提醒间隔
        </Text>

        <Card style={styles.reminderIntervalsCard} elevation={0}>
          <Card.Content style={styles.reminderOption}>
            <View style={styles.reminderOptionLeft}>
              <Text variant="titleMedium" style={styles.reminderTitle}>
                提前10分钟提醒
              </Text>
              <Text variant="bodyMedium" style={styles.reminderDescription}>
                在服药前10分钟收到提醒
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#BDBDBD', true: '#FFA726' }}
            />
          </Card.Content>
          <Divider style={styles.internalDivider} />
          <Card.Content style={styles.reminderOption}>
            <View style={styles.reminderOptionLeft}>
              <Text variant="titleMedium" style={styles.reminderTitle}>
                准时提醒
              </Text>
              <Text variant="bodyMedium" style={styles.reminderDescription}>
                在服药时收到提醒
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#BDBDBD', true: '#FFA726' }}
            />
          </Card.Content>
          <Divider style={styles.internalDivider} />
          <Card.Content style={styles.reminderOption}>
            <View style={styles.reminderOptionLeft}>
              <Text variant="titleMedium" style={styles.reminderTitle}>
                过期提醒
              </Text>
              <Text variant="bodyMedium" style={styles.reminderDescription}>
                服药5分钟后仍未确认，再次提醒
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#BDBDBD', true: '#FFA726' }}
            />
          </Card.Content>
        </Card>

        <Card style={styles.infoCard} elevation={0}>
          <Card.Content style={styles.infoContent}>
            <Avatar.Icon
              size={48}
              icon="information"
              style={styles.infoIcon}
              color={theme.colors.primary}
            />
            <View style={styles.infoText}>
              <Text variant="bodyMedium" style={styles.infoTitle}>
                提示
              </Text>
              <Text variant="bodyMedium" style={styles.infoDescription}>
                请确保系统通知权限已开启，否则无法收到提醒
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="bell-ring"
          onPress={() => setShowTestDialog(true)}
          style={styles.testButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          测试通知
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showTestDialog}
          onDismiss={() => setShowTestDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            测试通知
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              发送一条测试通知，确认通知权限是否正常工作？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowTestDialog(false)}
              labelStyle={styles.dialogButtonLabel}
            >
              取消
            </Button>
            <Button
              onPress={handleTestNotification}
              mode="contained"
              labelStyle={styles.dialogButtonLabel}
            >
              发送
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const Toolbar: React.FC<{
  title: string;
  onBack: () => void;
}> = ({ title, onBack }) => {
  return (
    <View style={toolbarStyles.container}>
      <View style={toolbarStyles.header}>
        <IconButton
          icon="arrow-left"
          size={32}
          iconColor="#FFFFFF"
          onPress={onBack}
          style={toolbarStyles.backButton}
        />
        <View style={toolbarStyles.titleContainer}>
          <Text variant="headlineMedium" style={toolbarStyles.title}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // 状态卡片
  statusCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  statusIcon: {
    backgroundColor: '#FAFAFA',
    marginRight: 16,
  },
  statusIconEnabled: {
    color: '#66BB6A',
  },
  statusIconDisabled: {
    color: '#9E9E9E',
  },
  statusText: {
    flex: 1,
  },
  statusTextMain: {
    fontSize: 22,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 16,
    color: '#757575',
  },

  // 设置项
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F',
    marginTop: 8,
    marginBottom: 12,
  },
  settingCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    backgroundColor: '#FFF3E0',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 16,
    color: '#757575',
  },

  // 分隔线
  divider: {
    marginBottom: 24,
    backgroundColor: '#E0E0E0',
  },
  internalDivider: {
    marginHorizontal: 12,
    backgroundColor: '#EEEEEE',
  },

  // 提醒间隔
  reminderIntervalsCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  reminderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  reminderOptionLeft: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 16,
    color: '#757575',
  },

  // 信息卡片
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#E3F2FD',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  infoIcon: {
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 16,
    color: '#546E7A',
  },

  // 按钮
  testButton: {
    borderColor: '#BDBDBD',
    marginTop: 8,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },

  // 对话框
  dialog: {
    borderRadius: 12,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  dialogText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#666666',
  },
  dialogButtonLabel: {
    fontSize: 18,
    paddingHorizontal: 16,
  },
});

const toolbarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
