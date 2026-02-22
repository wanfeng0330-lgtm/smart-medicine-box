import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog,
  useTheme,
} from 'react-native-paper';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Schedule } from '@/types/schedule';
import { LoadingSpinner } from '@/components/ui';
import { format } from 'date-fns';

/**
 * ScheduleScreen - 用药计划列表界面
 * 适老化设计 - Soft/pastel风格
 */
export const ScheduleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuthStore();
  const {
    schedules,
    fetchSchedules,
    deleteSchedule,
    toggleScheduleActive,
    isLoading,
    error,
    clearError,
  } = useScheduleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchSchedules(userProfile.familyId);
    }
  }, [userProfile, fetchSchedules]);

  useEffect(() => {
    if (error) {
      console.error('Error:', error);
      clearError();
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (userProfile?.familyId) {
      await fetchSchedules(userProfile.familyId);
    }
    setRefreshing(false);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteDialog(true);
    setMenuVisible(null);
  };

  const confirmDelete = async () => {
    if (!selectedSchedule) return;

    try {
      await deleteSchedule(selectedSchedule.id);
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    await toggleScheduleActive(schedule.id);
    setMenuVisible(null);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    navigation.navigate('AddSchedule', { scheduleId: schedule.id });
    setMenuVisible(null);
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => {
    const {
      id,
      medicineName,
      medicineDosage,
      medicineUnit,
      repeatType,
      startDate,
      endDate,
      frequency,
      dailyTimes,
      isActive,
    } = item;

    const displayDosage = `${medicineDosage} × ${medicineUnit}`;

    return (
      <Card
        key={id}
        style={[styles.scheduleCard, !isActive && styles.inactiveCard]}
        elevation={2}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.medicineInfo}>
              <Avatar.Text
                size={56}
                label={medicineName.charAt(0).toUpperCase()}
                style={styles.medicineAvatar}
                labelStyle={styles.avatarText}
              />
              <View style={styles.medicineText}>
                <Text variant="headlineMedium" style={styles.medicineName}>
                  {medicineName}
                </Text>
                <Text variant="bodyLarge" style={styles.dosageText}>
                  {displayDosage}
                </Text>
              </View>
            </View>

            <Menu
              visible={menuVisible === id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={32}
                  onPress={() => setMenuVisible(id)}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => handleEditSchedule(item)}
                title="编辑"
                titleStyle={{ fontSize: 18 }}
              />
              <Menu.Item
                leadingIcon={isActive ? 'pause-circle' : 'play-circle'}
                onPress={() => handleToggleActive(item)}
                title={isActive ? '暂停' : '启用'}
                titleStyle={{ fontSize: 18 }}
              />
              <Menu.Item
                leadingIcon="delete"
                onPress={() => handleDeleteSchedule(item)}
                titleStyle={{ fontSize: 18, color: theme.colors.error }}
                title="删除"
              />
            </Menu>
          </View>

          <View style={styles.statusSection}>
            <Chip
              mode="flat"
              style={[styles.statusChip, isActive ? styles.activeChip : styles.inactiveChip]}
              textStyle={styles.chipText}
              icon={isActive ? 'check-circle' : 'pause-circle'}
            >
              {isActive ? '进行中' : '已暂停'}
            </Chip>
            <Chip
              mode="outlined"
              style={styles.repeatChip}
              textStyle={styles.chipText}
              icon="calendar-repeat"
            >
              {useScheduleStore.getState().getRepeatLabel(repeatType)}
            </Chip>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                时间设置:
              </Text>
              <View style={styles.timesContainer}>
                {dailyTimes.map((t, index) => (
                  <Chip
                    key={index}
                    mode="flat"
                    style={styles.timeChip}
                    textStyle={{ fontSize: 16 }}
                  >
                    {`${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`}
                    {t.mealLabel && (
                      <Text style={styles.mealLabelText}>
                        {' '}{useScheduleStore.getState().getMealLabel(t.mealLabel)}
                      </Text>
                    )}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                执行日期: {startDate}
              </Text>
              {endDate && (
                <Text variant="bodyMedium" style={styles.endDateText}>
                  至 {endDate}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (schedules.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>
            <Avatar.Icon
              size={80}
              icon="calendar-clock"
              style={styles.emptyIcon}
              color={theme.colors.primary}
            />
            <Text variant="headlineLarge" style={styles.emptyTitle}>
              还没有用药计划
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              创建您的第一个用药计划，按时服药不漏服
            </Text>

            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('AddSchedule')}
              style={styles.emptyButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              创建计划
            </Button>
          </View>
        </ScrollView>

        <LoadingSpinner loading={isLoading} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {schedules.map((schedule) => (
          <View key={schedule.id}>
            {renderScheduleCard({ item: schedule })}
          </View>
        ))}
      </ScrollView>

      <Button
        mode="contained"
        icon="plus"
        onPress={() => navigation.navigate('AddSchedule')}
        style={styles.fabButton}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        创建计划
      </Button>

      <LoadingSpinner loading={isLoading} />

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            确认删除？
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              确定要删除用药计划"{selectedSchedule?.medicineName}"吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDeleteDialog(false)}
              labelStyle={styles.dialogButtonLabel}
            >
              取消
            </Button>
            <Button
              onPress={confirmDelete}
              mode="contained"
              buttonColor="#EF5350"
              labelStyle={styles.dialogButtonLabel}
            >
              确认删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    alignItems: 'center',
    paddingTop: 48,
  },

  // 空状态
  emptyIcon: {
    backgroundColor: '#E3F2FD',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#37474F',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },

  // 用药计划卡片
  scheduleCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inactiveCard: {
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicineAvatar: {
    backgroundColor: '#29B6F6',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  medicineText: {
    flex: 1,
  },
  medicineName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 16,
    color: '#757575',
  },

  // 状态部分
  statusSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    backgroundColor: '#66BB6A',
  },
  activeChip: {
    backgroundColor: '#66BB6A',
  },
  inactiveChip: {
    backgroundColor: '#BDBDBD',
  },
  repeatChip: {
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 14,
    color: '#FFFFFF',
  },

  // 信息部分
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#757575',
    marginRight: 8,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#FFFBEB',
  },
  mealLabelText: {
    fontSize: 14,
    color: '#757575',
  },
  endDateText: {
    fontSize: 16,
    color: '#757575',
    marginLeft: 8,
  },

  // 底部按钮
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    left: 24,
    backgroundColor: '#29B6F6',
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
