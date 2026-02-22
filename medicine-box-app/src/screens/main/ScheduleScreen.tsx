import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  IconButton,
  Menu,
  Portal,
  Dialog,
  SegmentedButtons,
  FAB,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseScheduleStore } from '@/stores/useCloudBaseScheduleStore';
import { REPEAT_LABELS, MEAL_LABELS, Schedule } from '@/types/schedule';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';
import { formatDosageWithUnit } from '@/utils/helpers';

type FilterType = 'all' | 'active' | 'paused';

export const ScheduleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const {
    schedules,
    fetchSchedules,
    deleteSchedule,
    toggleScheduleActive,
    isLoading,
    error,
    clearError,
  } = useCloudBaseScheduleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchSchedules(userProfile.familyId);
    }
  }, [userProfile, fetchSchedules]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
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

  const getFilteredSchedules = (): Schedule[] => {
    switch (filterBy) {
      case 'active':
        return schedules.filter((s) => s.isActive);
      case 'paused':
        return schedules.filter((s) => !s.isActive);
      default:
        return schedules;
    }
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
      Alert.alert('错误', '删除失败');
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

  const getMealLabelDisplay = (label?: string): string => {
    if (!label) return '';
    return MEAL_LABELS[label as keyof typeof MEAL_LABELS] || '';
  };

  const filteredSchedules = getFilteredSchedules();
  const activeCount = schedules.filter((s) => s.isActive).length;
  const pausedCount = schedules.filter((s) => !s.isActive).length;

  const renderScheduleCard = (schedule: Schedule) => {
    const {
      id,
      medicineName,
      medicineDosage,
      medicineUnit,
      repeatType,
      startDate,
      endDate,
      dailyTimes,
      isActive,
    } = schedule;

    return (
      <Card
        key={id}
        style={[
          styles.scheduleCard,
          !isActive && styles.inactiveCard,
        ]}
        elevation={2}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Avatar.Text
              size={56}
              label={medicineName.charAt(0).toUpperCase()}
              style={[styles.medicineAvatar, !isActive && styles.inactiveAvatar]}
              labelStyle={styles.avatarText}
            />
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName} numberOfLines={1}>
                {medicineName}
              </Text>
              <Text style={styles.dosageText}>
                {formatDosageWithUnit(medicineDosage, medicineUnit)}
              </Text>
            </View>

            <Menu
              visible={menuVisible === id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={28}
                  onPress={() => setMenuVisible(id)}
                  iconColor={COLORS.textSecondary}
                />
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => handleEditSchedule(schedule)}
                title="编辑"
                titleStyle={styles.menuItemTitle}
              />
              <Menu.Item
                leadingIcon={isActive ? 'pause-circle' : 'play-circle'}
                onPress={() => handleToggleActive(schedule)}
                title={isActive ? '暂停' : '启用'}
                titleStyle={styles.menuItemTitle}
              />
              <Divider />
              <Menu.Item
                leadingIcon="delete"
                onPress={() => handleDeleteSchedule(schedule)}
                titleStyle={[styles.menuItemTitle, { color: COLORS.error }]}
                title="删除"
              />
            </Menu>
          </View>

          <View style={styles.statusRow}>
            <Chip
              mode="flat"
              style={[styles.statusChip, isActive ? styles.activeChip : styles.pausedChip]}
              textStyle={styles.statusChipText}
              icon={isActive ? 'check-circle' : 'pause-circle'}
            >
              {isActive ? '进行中' : '已暂停'}
            </Chip>
            <Chip
              mode="outlined"
              style={styles.repeatChip}
              textStyle={styles.repeatChipText}
              icon="calendar-repeat"
            >
              {REPEAT_LABELS[repeatType]}
            </Chip>
          </View>

          <View style={styles.timesSection}>
            <Text style={styles.timesLabel}>服药时间</Text>
            <View style={styles.timesContainer}>
              {dailyTimes.map((time, index) => (
                <View key={index} style={styles.timeItem}>
                  <Text style={styles.timeText}>
                    {`${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`}
                  </Text>
                  {time.mealLabel && (
                    <Text style={styles.mealText}>
                      {getMealLabelDisplay(time.mealLabel)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>
              开始: {startDate}
            </Text>
            {endDate && (
              <Text style={styles.dateLabel}>
                结束: {endDate}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        size={100}
        icon="calendar-clock"
        style={styles.emptyIcon}
        color={COLORS.primary}
      />
      <Text style={styles.emptyTitle}>暂无用药计划</Text>
      <Text style={styles.emptySubtitle}>
        创建您的第一个用药计划，按时服药不漏服
      </Text>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => navigation.navigate('AddSchedule')}
        style={styles.emptyButton}
        contentStyle={styles.emptyButtonContent}
        labelStyle={styles.emptyButtonLabel}
        buttonColor={COLORS.primary}
      >
        创建计划
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={GRADIENTS.header}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>用药计划</Text>
            <Text style={styles.headerSubtitle}>
              {activeCount} 个进行中 · {pausedCount} 个已暂停
            </Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="calendar-check"
            style={styles.headerIcon}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <View style={styles.filterBar}>
        <SegmentedButtons
          value={filterBy}
          onValueChange={(value) => setFilterBy(value as FilterType)}
          buttons={[
            { value: 'all', label: `全部 (${schedules.length})` },
            { value: 'active', label: `进行中 (${activeCount})` },
            { value: 'paused', label: `已暂停 (${pausedCount})` },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map(renderScheduleCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddSchedule')}
        color="#FFFFFF"
        customSize={60}
      />

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              确定要删除用药计划「{selectedSchedule?.medicineName}」吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button
              onPress={confirmDelete}
              mode="contained"
              buttonColor={COLORS.error}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <LoadingSpinner loading={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Nunito_ExtraBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Lato_Regular',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedButtons: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  scheduleCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  inactiveCard: {
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicineAvatar: {
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  inactiveAvatar: {
    backgroundColor: COLORS.textSecondary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 2,
  },
  dosageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    borderRadius: 12,
    height: 32,
  },
  activeChip: {
    backgroundColor: COLORS.success + '20',
  },
  pausedChip: {
    backgroundColor: COLORS.textSecondary + '20',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },
  repeatChip: {
    borderRadius: 12,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '20',
    height: 32,
  },
  repeatChipText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Lato_Medium',
  },

  timesSection: {
    marginBottom: 12,
  },
  timesLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Medium',
    marginBottom: 8,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning,
    fontFamily: 'Nunito_SemiBold',
  },
  mealText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontFamily: 'Lato_Regular',
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  menuContent: {
    borderRadius: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Lato_Regular',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    backgroundColor: COLORS.primaryLight + '20',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 20,
  },
  emptyButtonContent: {
    paddingHorizontal: 32,
    height: 52,
  },
  emptyButtonLabel: {
    fontSize: 18,
    fontFamily: 'Nunito_SemiBold',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    ...SHADOWS.medium,
  },

  dialog: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  dialogText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Lato_Regular',
  },
});
