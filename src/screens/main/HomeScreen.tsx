import React, { useState, useEffect } from 'react';
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
  Divider,
  Portal,
  Dialog,
  useTheme,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { useScheduleStore } from '@/stores/useScheduleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { TodayMedication, MedicationStatus } from '@/types/schedule';
import { LoadingSpinner } from '@/components/ui';

/**
 * HomeScreen - 主屏幕（今日用药）
 * 适老化设计 - Soft/pastel风格
 */
export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuthStore();
  const {
    getTodayMedications,
    markAsTaken,
    skipMedication,
    isLoading,
    error,
    clearError,
  } = useScheduleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [todayMedications, setTodayMedications] = useState<TodayMedication[]>([]);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<TodayMedication | null>(null);
  const [skipNote, setSkipNote] = useState('');

  const [selectedDate] = useState(new Date());

  useEffect(() => {
    loadTodayMedications();
  }, [userProfile, selectedDate]);

  useEffect(() => {
    if (error) {
      console.error('Error:', error);
      clearError();
    }
  }, [error, clearError]);

  const loadTodayMedications = async () => {
    if (!userProfile?.familyId) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const medications = await getTodayMedications(userProfile.familyId, dateStr);
    setTodayMedications(medications);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayMedications();
    setRefreshing(false);
  };

  const handleMarkTaken = async (medication: TodayMedication) => {
    if (!medication.record) {
      Alert.alert('错误', '未找到服药记录');
      return;
    }

    try {
      await markAsTaken(medication.record.id);
      await loadTodayMedications();
    } catch (error) {
      console.error('Mark as taken failed:', error);
    }
  };

  const handleSkip = (medication: TodayMedication) => {
    setSelectedMedication(medication);
    setShowSkipDialog(true);
  };

  const confirmSkip = async () => {
    if (!selectedMedication || !selectedMedication.record) return;

    try {
      await skipMedication(selectedMedication.record.id, skipNote);
      setShowSkipDialog(false);
      setSelectedMedication(null);
      setSkipNote('');
      await loadTodayMedications();
    } catch (error) {
      console.error('Skip failed:', error);
    }
  };

  const getStatusConfig = (status: MedicationStatus) => {
    switch (status) {
      case 'taken':
        return {
          icon: 'check-circle',
          color: '#66BB6A',
          bgColor: '#E8F5E9',
          label: '已服',
        };
      case 'missed':
        return {
          icon: 'alert-circle',
          color: '#EF5350',
          bgColor: '#FFEBEE',
          label: '已错过',
        };
      case 'skipped':
        return {
          icon: 'pause-circle',
          color: '#FF9800',
          bgColor: '#FFF3E0',
          label: '已跳过',
        };
      case 'scheduled':
      default:
        return {
          icon: 'clock-outline',
          color: '#29B6F6',
          bgColor: '#E3F2FD',
          label: '待服',
        };
    }
  };

  const getNextMedication = (): TodayMedication | null => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const med of todayMedications) {
      if (med.status === 'scheduled' && med.time > currentTime) {
        return med;
      }
    }
    return null;
  };

  const getProgress = () => {
    if (todayMedications.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = todayMedications.filter(
      (m) => m.status === 'taken'
    ).length;
    const total = todayMedications.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  const renderHeader = () => {
    const progress = getProgress();
    const nextMedication = getNextMedication();

    return (
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.dateSection}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              {format(selectedDate, 'M月d日', { locale: zhCN })}
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              {format(selectedDate, 'EEEE', { locale: zhCN })}
            </Text>
          </View>

          <View style={styles.progressSection}>
            <Avatar.Text
              size={72}
              label={`${progress.percentage}%`}
              style={styles.progressAvatar}
              labelStyle={styles.progressLabel}
            />
            <Text variant="bodyLarge" style={styles.progressText}>
              今日完成度
            </Text>
            <Text variant="bodyMedium" style={styles.progressDetail}>
              {progress.completed} / {progress.total}
            </Text>
          </View>
        </View>

        {nextMedication && (
          <View style={styles.nextMedication}>
            <Chip icon="bell-alert" mode="flat" style={styles.nextChip} textStyle={styles.nextChipText}>
              下次服药：{nextMedication.time} {nextMedication.mealLabel && useScheduleStore.getState().getMealLabel(nextMedication.mealLabel || 'no_meal')}
            </Chip>
          </View>
        )}
      </View>
    );
  };

  const renderMedicationCard = (medication: TodayMedication) => {
    const statusConfig = getStatusConfig(medication.status);
    const displayTime = medication.time;
    const displayDosage = medication.dosage || medication.medicineDosage;
    const displayUnit = medication.medicineUnit;

    const isPastDue = medication.status === 'missed';
    const isFinished = medication.status === 'taken' || medication.status === 'skipped';

    return (
      <Card
        key={`${medication.scheduleId}-${medication.time}`}
        style={[
          styles.medicationCard,
          isPastDue && styles.pastDueCard,
          isFinished && styles.finishedCard,
        ]}
        elevation={2}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.timeSection}>
              <View style={[styles.timeBadge, { backgroundColor: statusConfig.bgColor }]}>
                <Avatar.Text
                  size={48}
                  label={displayTime}
                  style={styles.timeAvatar}
                  labelStyle={styles.timeLabel}
                />
              </View>

              <View style={styles.timeInfo}>
                <Text variant="headlineMedium" style={styles.medicineName}>
                  {medication.medicineName}
                </Text>
                <Text variant="bodyLarge" style={styles.dosageText}>
                  {displayDosage} × {displayUnit}
                </Text>
                {medication.mealLabel && (
                  <Chip
                    mode="outlined"
                    style={styles.mealChip}
                    textStyle={{ fontSize: 14 }}
                    icon="food"
                  >
                    {useScheduleStore.getState().getMealLabel(medication.mealLabel)}
                  </Chip>
                )}
              </View>
            </View>

            <View style={styles.statusSection}>
              <Chip
                mode="flat"
                icon={statusConfig.icon}
                style={[styles.statusChip, { backgroundColor: statusConfig.bgColor }]}
                textStyle={[styles.statusText, { color: statusConfig.color }]}
              >
                {statusConfig.label}
              </Chip>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={[styles.actions, isFinished && styles.finishedActions]}>
            {medication.status === 'scheduled' && (
              <>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={() => handleMarkTaken(medication)}
                  style={styles.takenButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.actionButtonLabel}
                >
                  已服
                </Button>
                <Button
                  mode="outlined"
                  icon="close"
                  onPress={() => handleSkip(medication)}
                  style={styles.skipButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.actionButtonLabel}
                >
                  跳过
                </Button>
              </>
            )}

            {medication.record?.notes && (
              <View style={styles.notesSection}>
                <Text variant="bodyMedium" style={styles.notesLabel}>
                  备注：
                </Text>
                <Text variant="bodyMedium" style={styles.notesText}>
                  {medication.record.notes}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (todayMedications.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyState}>
            <Avatar.Icon
              size={96}
              icon="calendar-check"
              style={styles.emptyIcon}
              color={theme.colors.primary}
            />
            <Text variant="headlineLarge" style={styles.emptyTitle}>
              今日无用药计划
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              您今天没有需要服用的药品
            </Text>

            <Button
              mode="outlined"
              icon="calendar-edit"
              onPress={() => navigation.navigate('Schedule')}
              style={styles.emptyButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              管理用药计划
            </Button>
          </View>
        </ScrollView>

        <LoadingSpinner loading={isLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {todayMedications.map((medication) => renderMedicationCard(medication))}
      </ScrollView>

      <LoadingSpinner loading={isLoading} />

      <Portal>
        <Dialog
          visible={showSkipDialog}
          onDismiss={() => setShowSkipDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            确认跳过？
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              确定要跳过 "{selectedMedication?.medicineName}" 这次服药吗？
            </Text>

            <TextInput
              label="跳过原因（可选）"
              value={skipNote}
              onChangeText={setSkipNote}
              mode="outlined"
              multiline
              numberOfLines={2}
              placeholder="例如：外出吃饭"
              style={styles.dialogInput}
              contentStyle={styles.inputContent}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowSkipDialog(false)}
              labelStyle={styles.dialogButtonLabel}
            >
              取消
            </Button>
            <Button
              onPress={confirmSkip}
              mode="contained"
              buttonColor="#EF5350"
              labelStyle={styles.dialogButtonLabel}
            >
              确认跳过
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // 头部
  header: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressAvatar: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFA726',
    fontSize: 24,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressDetail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  nextMedication: {
    paddingHorizontal: 16,
  },
  nextChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextChipText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyIcon: {
    backgroundColor: '#FFF3E0',
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
    borderColor: '#BDBDBD',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },

  // 用药卡片
  medicationCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  pastDueCard: {
    backgroundColor: '#FFEBEE',
  },
  finishedCard: {
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  timeBadge: {
    borderRadius: 24,
  },
  timeAvatar: {
    backgroundColor: '#FFFFFF',
  },
  timeLabel: {
    color: '#29B6F6',
    fontSize: 16,
    fontWeight: '700',
  },
  timeInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 6,
  },
  dosageText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  mealChip: {
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    borderColor: '#FFE0B2',
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  finishedActions: {
    opacity: 0.5,
  },
  takenButton: {
    flex: 1,
    backgroundColor: '#66BB6A',
  },
  skipButton: {
    flex: 1,
    borderColor: '#EF5350',
  },
  actionButtonContent: {
    height: 48,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  notesLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 16,
    color: '#37474F',
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
    marginBottom: 16,
  },
  dialogInput: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputContent: {
    fontSize: 16,
  },
  dialogButtonLabel: {
    fontSize: 18,
    paddingHorizontal: 16,
  },
});
