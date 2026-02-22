import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  IconButton,
  ProgressBar,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseScheduleStore } from '@/stores/useCloudBaseScheduleStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { useAccessibilityStore } from '@/stores/useAccessibilityStore';
import { TodayMedication, MedicationStatus } from '@/types/schedule';
import { Medicine } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';
import { ModeToggle } from '@/components/ModeToggle';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const {
    schedules,
    records,
    fetchSchedules,
    fetchRecords,
    isLoading: scheduleLoading,
  } = useCloudBaseScheduleStore();
  const { medicines, fetchMedicines, isLoading: medicineLoading } =
    useCloudBaseMedicineStore();
  const { mode, fontSizeLevel } = useAccessibilityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [todayMedications, setTodayMedications] = useState<TodayMedication[]>([]);
  const [todayProgress, setTodayProgress] = useState(0);

  const isLoading = scheduleLoading || medicineLoading;
  const isSeniorMode = mode === 'senior';

  useEffect(() => {
    loadData();
  }, [userProfile]);

  useEffect(() => {
    if (schedules.length > 0 && records.length >= 0) {
      calculateTodayMedications();
    }
  }, [schedules, records]);

  const loadData = async () => {
    if (!userProfile?.familyId) return;

    try {
      await Promise.all([
        fetchSchedules(userProfile.familyId),
        fetchMedicines(userProfile.familyId),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateTodayMedications = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRecords = records.filter((r) => r.date === today);

    const meds: TodayMedication[] = [];
    schedules.forEach((schedule) => {
      if (!schedule.isActive) return;

      schedule.dailyTimes.forEach((time, index) => {
        const record = todayRecords.find(
          (r) =>
            r.scheduleId === schedule.id &&
            r.timeHour === time.hour &&
            r.timeMinute === time.minute
        );

        meds.push({
          id: `${schedule.id}-${index}`,
          scheduleId: schedule.id,
          medicineId: schedule.medicineId,
          medicineName: schedule.medicineName,
          dosage: time.dosage || schedule.medicineDosage,
          unit: schedule.medicineUnit,
          time: `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`,
          timeHour: time.hour,
          timeMinute: time.minute,
          mealLabel: time.mealLabel,
          status: record?.status || 'scheduled',
          recordId: record?.id,
        });
      });
    });

    meds.sort((a, b) => {
      if (a.timeHour !== b.timeHour) return a.timeHour - b.timeHour;
      return a.timeMinute - b.timeMinute;
    });

    setTodayMedications(meds);

    const taken = meds.filter((m) => m.status === 'taken').length;
    const total = meds.length;
    setTodayProgress(total > 0 ? taken / total : 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getMedicationsByStatus = (status: MedicationStatus) => {
    return todayMedications.filter((m) => m.status === status);
  };

  const getLowStockMedicines = (): Medicine[] => {
    return medicines.filter((m) => m.stock <= 5);
  };

  const getUpcomingMedications = (): TodayMedication[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return todayMedications.filter((m) => {
      if (m.status !== 'scheduled') return false;
      return (
        m.timeHour > currentHour ||
        (m.timeHour === currentHour && m.timeMinute >= currentMinute)
      );
    }).slice(0, 3);
  };

  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case 'taken':
        return COLORS.success;
      case 'missed':
        return COLORS.error;
      case 'skipped':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getMealLabelDisplay = (label?: string) => {
    if (!label) return '';
    const labels: Record<string, string> = {
      before_meal: '饭前',
      after_meal: '饭后',
      with_meal: '餐时',
      no_meal: '',
    };
    return labels[label] || '';
  };

  const takenCount = getMedicationsByStatus('taken').length;
  const upcomingMeds = getUpcomingMedications();
  const lowStockMeds = getLowStockMedicines();

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.quickActionsGrid}>
        <Surface style={styles.quickActionCard} elevation={2}>
          <Button
            mode="contained"
            icon="pill"
            onPress={() => navigation.navigate('AddMedicine')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionButtonContent}
            labelStyle={styles.quickActionButtonLabel}
            buttonColor={COLORS.primary}
          >
            添加药品
          </Button>
        </Surface>

        <Surface style={styles.quickActionCard} elevation={2}>
          <Button
            mode="contained"
            icon="calendar-plus"
            onPress={() => navigation.navigate('AddSchedule')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionButtonContent}
            labelStyle={styles.quickActionButtonLabel}
            buttonColor={COLORS.secondary}
          >
            创建计划
          </Button>
        </Surface>

        <Surface style={styles.quickActionCard} elevation={2}>
          <Button
            mode="contained"
            icon="grid"
            onPress={() => navigation.navigate('Box')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionButtonContent}
            labelStyle={styles.quickActionButtonLabel}
            buttonColor={COLORS.accent}
          >
            药盒管理
          </Button>
        </Surface>

        <Surface style={styles.quickActionCard} elevation={2}>
          <Button
            mode="contained"
            icon="chart-line"
            onPress={() => navigation.navigate('Report')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionButtonContent}
            labelStyle={styles.quickActionButtonLabel}
            buttonColor={COLORS.warning}
          >
            服药报告
          </Button>
        </Surface>
      </View>
    </View>
  );

  const renderTodayProgress = () => (
    <Card style={styles.progressCard} elevation={4}>
      <LinearGradient
        colors={['#FFFFFF', '#F7F3EB']}
        style={styles.progressGradient}
      >
        <Card.Content>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>今日服药进度</Text>
              <Text style={styles.progressDate}>
                {format(new Date(), 'M月d日 EEEE', { locale: zhCN })}
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>{takenCount}</Text>
              <Text style={styles.progressTotal}>/ {todayMedications.length}</Text>
            </View>
          </View>

          <ProgressBar
            progress={todayProgress}
            color={COLORS.success}
            style={styles.progressBar}
          />

          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.progressStatText}>已服 {takenCount}</Text>
            </View>
            <View style={styles.progressStatItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.progressStatText}>待服 {todayMedications.length - takenCount}</Text>
            </View>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  const renderUpcomingMedications = () => {
    if (upcomingMeds.length === 0) return null;

    return (
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>即将服药</Text>
        {upcomingMeds.map((med) => (
          <Card key={med.id} style={styles.medicationCard} elevation={2}>
            <Card.Content style={styles.medicationContent}>
              <View style={styles.medicationTime}>
                <Text style={styles.medicationTimeText}>{med.time}</Text>
                {med.mealLabel && (
                  <Text style={styles.medicationMeal}>
                    {getMealLabelDisplay(med.mealLabel)}
                  </Text>
                )}
              </View>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{med.medicineName}</Text>
                <Text style={styles.medicationDosage}>
                  {med.dosage} {med.unit}
                </Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: COLORS.primaryLight + '30' }]}
                textStyle={styles.statusChipText}
              >
                待服
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderLowStockWarning = () => {
    if (lowStockMeds.length === 0) return null;

    return (
      <Card style={styles.warningCard} elevation={2}>
        <Card.Content>
          <View style={styles.warningHeader}>
            <Avatar.Icon
              size={40}
              icon="alert-circle"
              style={styles.warningIcon}
              color={COLORS.warning}
            />
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>库存预警</Text>
              <Text style={styles.warningSubtitle}>
                {lowStockMeds.length} 种药品库存不足
              </Text>
            </View>
          </View>
          <View style={styles.warningMedicines}>
            {lowStockMeds.slice(0, 3).map((med) => (
              <Chip
                key={med.id}
                mode="outlined"
                style={styles.warningChip}
                textStyle={styles.warningChipText}
              >
                {med.name}: {med.stock}{med.unit}
              </Chip>
            ))}
          </View>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Medicines')}
            textColor={COLORS.warning}
            labelStyle={styles.warningButtonLabel}
          >
            查看全部药品
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (todayMedications.length === 0 && !isLoading) {
      return (
        <Card style={styles.emptyCard} elevation={2}>
          <Card.Content style={styles.emptyContent}>
            <Avatar.Icon
              size={80}
              icon="calendar-check"
              style={styles.emptyIcon}
              color={COLORS.primary}
            />
            <Text style={styles.emptyTitle}>今天还没有用药计划</Text>
            <Text style={styles.emptySubtitle}>
              创建用药计划，系统会及时提醒您服药
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
          </Card.Content>
        </Card>
      );
    }
    return null;
  };

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
            <Text style={[styles.greeting, isSeniorMode && styles.seniorGreeting]}>{getGreeting()}</Text>
            <Text style={[styles.userName, isSeniorMode && styles.seniorUserName]}>{userProfile?.name || '用户'}</Text>
          </View>
          <View style={styles.headerRight}>
            <ModeToggle />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderQuickActions()}
        {renderTodayProgress()}
        {renderUpcomingMedications()}
        {renderLowStockWarning()}
        {renderEmptyState()}
      </ScrollView>

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
    paddingBottom: 24,
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
  headerRight: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Lato_Regular',
    marginBottom: 4,
  },
  seniorGreeting: {
    fontSize: 24,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Nunito_ExtraBold',
  },
  seniorUserName: {
    fontSize: 36,
  },
  userAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  userAvatarLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito_Bold',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Nunito_Bold',
  },

  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  quickActionButton: {
    borderRadius: 20,
  },
  quickActionButtonContent: {
    height: 80,
    flexDirection: 'column',
  },
  quickActionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_SemiBold',
  },

  progressCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  progressGradient: {
    borderRadius: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  progressCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Nunito_ExtraBold',
  },
  progressTotal: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.backgroundDark,
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 24,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  progressStatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  upcomingSection: {
    marginBottom: 24,
  },
  medicationCard: {
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  medicationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  medicationTime: {
    width: 80,
    alignItems: 'center',
  },
  medicationTimeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Nunito_Bold',
  },
  medicationMeal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginTop: 2,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  statusChip: {
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  warningCard: {
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    ...SHADOWS.small,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    backgroundColor: 'transparent',
  },
  warningText: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.warning,
    fontFamily: 'Nunito_Bold',
  },
  warningSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  warningMedicines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  warningChip: {
    borderRadius: 12,
    borderColor: COLORS.warning,
    backgroundColor: '#FFFFFF',
  },
  warningChipText: {
    fontSize: 14,
    color: COLORS.warning,
    fontFamily: 'Lato_Medium',
  },
  warningButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  emptyCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.medium,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    backgroundColor: COLORS.primaryLight + '20',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
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
    fontWeight: '600',
    fontFamily: 'Nunito_SemiBold',
  },
});
