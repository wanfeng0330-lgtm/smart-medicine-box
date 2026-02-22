import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  SegmentedButtons,
  Avatar,
  ProgressBar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseScheduleStore } from '@/stores/useCloudBaseScheduleStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

const { width } = Dimensions.get('window');

type TimeRange = 'day' | 'week' | 'month';

interface Stats {
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  scheduled: number;
  rate: number;
}

interface MedicineStats {
  name: string;
  total: number;
  taken: number;
  rate: number;
}

export const ReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const { schedules, records, fetchSchedules } = useCloudBaseScheduleStore();
  const { medicines, fetchMedicines } = useCloudBaseMedicineStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [overallStats, setOverallStats] = useState<Stats>({
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0,
    scheduled: 0,
    rate: 0,
  });
  const [medicineStats, setMedicineStats] = useState<MedicineStats[]>([]);
  const [dailyStats, setDailyStats] = useState<{ date: string; rate: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [userProfile, timeRange]);

  const loadData = async () => {
    if (!userProfile?.familyId) return;

    setIsLoading(true);
    try {
      await fetchSchedules(userProfile.familyId);
      await fetchMedicines(userProfile.familyId);
      calculateStats();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = () => {
    const today = new Date();
    switch (timeRange) {
      case 'day':
        return { start: today, end: today };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const calculateStats = () => {
    const { start, end } = getDateRange();
    const startDateStr = format(start, 'yyyy-MM-dd');
    const endDateStr = format(end, 'yyyy-MM-dd');

    const filteredRecords = records.filter((r) => {
      return r.date >= startDateStr && r.date <= endDateStr;
    });

    const total = filteredRecords.length;
    const taken = filteredRecords.filter((r) => r.status === 'taken').length;
    const missed = filteredRecords.filter((r) => r.status === 'missed').length;
    const skipped = filteredRecords.filter((r) => r.status === 'skipped').length;
    const scheduled = filteredRecords.filter((r) => r.status === 'scheduled').length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

    setOverallStats({ total, taken, missed, skipped, scheduled, rate });

    const medicineMap = new Map<string, { name: string; total: number; taken: number }>();

    schedules.forEach((schedule) => {
      const scheduleRecords = filteredRecords.filter((r) => r.scheduleId === schedule.id);
      const existing = medicineMap.get(schedule.medicineId) || { name: schedule.medicineName, total: 0, taken: 0 };
      existing.total += scheduleRecords.length;
      existing.taken += scheduleRecords.filter((r) => r.status === 'taken').length;
      medicineMap.set(schedule.medicineId, existing);
    });

    const medStats: MedicineStats[] = Array.from(medicineMap.entries()).map(([id, data]) => ({
      name: data.name,
      total: data.total,
      taken: data.taken,
      rate: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
    }));

    medStats.sort((a, b) => b.total - a.total);
    setMedicineStats(medStats);

    const days = eachDayOfInterval({ start, end });
    const dailyData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRecords = filteredRecords.filter((r) => r.date === dateStr);
      const dayTotal = dayRecords.length;
      const dayTaken = dayRecords.filter((r) => r.status === 'taken').length;
      return {
        date: dateStr,
        rate: dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 0,
      };
    });

    setDailyStats(dailyData);
  };

  const handleExport = async () => {
    const { start, end } = getDateRange();
    const dateRange = timeRange === 'day'
      ? format(start, 'yyyy年M月d日', { locale: zhCN })
      : `${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })}`;

    let reportText = `智能药盒 - 用药报告\n`;
    reportText += `报告周期: ${dateRange}\n\n`;
    reportText += `【整体统计】\n`;
    reportText += `总服药次数: ${overallStats.total}次\n`;
    reportText += `已服药: ${overallStats.taken}次\n`;
    reportText += `漏服: ${overallStats.missed}次\n`;
    reportText += `跳过: ${overallStats.skipped}次\n`;
    reportText += `服药率: ${overallStats.rate}%\n\n`;

    if (medicineStats.length > 0) {
      reportText += `【药品统计】\n`;
      medicineStats.forEach((med) => {
        reportText += `${med.name}: ${med.taken}/${med.total}次 (${med.rate}%)\n`;
      });
    }

    try {
      await Share.share({
        message: reportText,
        title: '用药报告',
      });
    } catch (error) {
      Alert.alert('错误', '导出失败');
    }
  };

  const getRateColor = (rate: number): string => {
    if (rate >= 80) return COLORS.success;
    if (rate >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const getRateLabel = (rate: number): string => {
    if (rate >= 80) return '优秀';
    if (rate >= 60) return '良好';
    if (rate >= 40) return '一般';
    return '需改进';
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const renderOverallStats = () => (
    <Card style={styles.overallCard} elevation={4}>
      <LinearGradient
        colors={['#FFFFFF', '#F7F3EB']}
        style={styles.overallGradient}
      >
        <Card.Content>
          <View style={styles.rateCircle}>
            <View style={[styles.rateProgress, { borderColor: getRateColor(overallStats.rate) }]}>
              <Text style={[styles.rateNumber, { color: getRateColor(overallStats.rate) }]}>
                {overallStats.rate}%
              </Text>
              <Text style={styles.rateLabel}>{getRateLabel(overallStats.rate)}</Text>
            </View>
          </View>

          <Text style={styles.rateTitle}>服药完成率</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Avatar.Icon
                size={48}
                icon="clipboard-list"
                style={[styles.statIcon, { backgroundColor: COLORS.primaryLight + '30' }]}
                color={COLORS.primary}
              />
              <Text style={styles.statValue}>{overallStats.total}</Text>
              <Text style={styles.statLabel}>总次数</Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={48}
                icon="check-circle"
                style={[styles.statIcon, { backgroundColor: COLORS.successLight + '30' }]}
                color={COLORS.success}
              />
              <Text style={styles.statValue}>{overallStats.taken}</Text>
              <Text style={styles.statLabel}>已服用</Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={48}
                icon="close-circle"
                style={[styles.statIcon, { backgroundColor: COLORS.errorLight + '30' }]}
                color={COLORS.error}
              />
              <Text style={styles.statValue}>{overallStats.missed}</Text>
              <Text style={styles.statLabel}>漏服</Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={48}
                icon="skip-next"
                style={[styles.statIcon, { backgroundColor: COLORS.warningLight + '30' }]}
                color={COLORS.warning}
              />
              <Text style={styles.statValue}>{overallStats.skipped}</Text>
              <Text style={styles.statLabel}>跳过</Text>
            </View>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  const renderDailyChart = () => {
    if (timeRange !== 'week' || dailyStats.length === 0) return null;

    return (
      <Card style={styles.dailyCard} elevation={2}>
        <Card.Content>
          <Text style={styles.cardTitle}>每日统计</Text>
          <View style={styles.dailyGrid}>
            {dailyStats.map((day, index) => {
              const dayName = weekDays[new Date(day.date).getDay() - 1] || weekDays[6];
              return (
                <View key={day.date} style={styles.dayColumn}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        backgroundColor: day.rate > 0 ? getRateColor(day.rate) : COLORS.border,
                        height: Math.max(day.rate * 0.8, 4),
                      },
                    ]}
                  />
                  <Text style={styles.dayRate}>{day.rate}%</Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMedicineStats = () => {
    if (medicineStats.length === 0) return null;

    return (
      <Card style={styles.medicineCard} elevation={2}>
        <Card.Content>
          <Text style={styles.cardTitle}>药品统计</Text>
          <Text style={styles.cardSubtitle}>各药品服药情况</Text>

          {medicineStats.slice(0, 5).map((med, index) => (
            <View key={index} style={styles.medicineItem}>
              <View style={styles.medicineItemHeader}>
                <Avatar.Text
                  size={40}
                  label={med.name.charAt(0).toUpperCase()}
                  style={[styles.medicineItemIcon, { backgroundColor: getRateColor(med.rate) + '20' }]}
                  labelStyle={[styles.medicineItemIconLabel, { color: getRateColor(med.rate) }]}
                />
                <View style={styles.medicineItemInfo}>
                  <Text style={styles.medicineItemName}>{med.name}</Text>
                  <Text style={styles.medicineItemCount}>
                    {med.taken}/{med.total}次
                  </Text>
                </View>
                <View style={[styles.medicineItemRate, { backgroundColor: getRateColor(med.rate) + '20' }]}>
                  <Text style={[styles.medicineItemRateText, { color: getRateColor(med.rate) }]}>
                    {med.rate}%
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={med.rate / 100}
                color={getRateColor(med.rate)}
                style={styles.progressBar}
              />
            </View>
          ))}

          {medicineStats.length > 5 && (
            <Text style={styles.moreText}>还有 {medicineStats.length - 5} 种药品...</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderTips = () => (
    <Card style={styles.tipsCard} elevation={2}>
      <Card.Content>
        <Text style={styles.cardTitle}>健康建议</Text>
        <View style={styles.tipsList}>
          {overallStats.rate < 60 && (
            <View style={styles.tipItem}>
              <Avatar.Icon size={32} icon="alert" style={styles.tipIcon} color={COLORS.warning} />
              <Text style={styles.tipText}>您的服药率较低，建议设置更多提醒</Text>
            </View>
          )}
          {overallStats.rate >= 60 && overallStats.rate < 80 && (
            <View style={styles.tipItem}>
              <Avatar.Icon size={32} icon="lightbulb" style={styles.tipIcon} color={COLORS.primary} />
              <Text style={styles.tipText}>保持良好的服药习惯，再接再厉！</Text>
            </View>
          )}
          {overallStats.rate >= 80 && (
            <View style={styles.tipItem}>
              <Avatar.Icon size={32} icon="party-popper" style={styles.tipIcon} color={COLORS.success} />
              <Text style={styles.tipText}>太棒了！您有很好的服药习惯</Text>
            </View>
          )}
          {overallStats.missed > 0 && (
            <View style={styles.tipItem}>
              <Avatar.Icon size={32} icon="bell" style={styles.tipIcon} color={COLORS.accent} />
              <Text style={styles.tipText}>建议检查提醒设置，减少漏服</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => {
    if (overallStats.total === 0 && !isLoading) {
      return (
        <Card style={styles.emptyCard} elevation={2}>
          <Card.Content style={styles.emptyContent}>
            <Avatar.Icon
              size={80}
              icon="chart-line"
              style={styles.emptyIcon}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>暂无数据</Text>
            <Text style={styles.emptySubtitle}>
              创建用药计划后，这里会显示您的服药统计数据
            </Text>
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
            <Text style={styles.headerTitle}>用药报告</Text>
            <Text style={styles.headerSubtitle}>数据分析与健康追踪</Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="chart-line"
            style={styles.headerIcon}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          buttons={[
            { value: 'day', label: '今日' },
            { value: 'week', label: '本周' },
            { value: 'month', label: '本月' },
          ]}
          style={styles.timeRangeSelector}
        />

        {overallStats.total > 0 ? (
          <>
            {renderOverallStats()}
            {renderDailyChart()}
            {renderMedicineStats()}
            {renderTips()}
          </>
        ) : (
          renderEmptyState()
        )}

        {overallStats.total > 0 && (
          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleExport}
            style={styles.exportButton}
            contentStyle={styles.exportButtonContent}
            labelStyle={styles.exportButtonLabel}
            buttonColor={COLORS.primary}
          >
            导出报告
          </Button>
        )}
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  timeRangeSelector: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },

  overallCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  overallGradient: {
    borderRadius: 24,
  },
  rateCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rateProgress: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateNumber: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'Nunito_ExtraBold',
  },
  rateLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Medium',
  },
  rateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Nunito_SemiBold',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginTop: 2,
  },

  dailyCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Nunito_Bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontFamily: 'Lato_Regular',
  },
  dailyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontFamily: 'Lato_Medium',
  },
  dayBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  dayRate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  medicineCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  medicineItem: {
    marginBottom: 16,
  },
  medicineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineItemIcon: {
    marginRight: 12,
  },
  medicineItemIconLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  medicineItemInfo: {
    flex: 1,
  },
  medicineItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  medicineItemCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  medicineItemRate: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicineItemRateText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  moreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Lato_Regular',
  },

  tipsCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Lato_Regular',
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
    backgroundColor: COLORS.background,
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
  },

  exportButton: {
    borderRadius: 20,
    marginTop: 8,
  },
  exportButtonContent: {
    height: 56,
  },
  exportButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_SemiBold',
  },
});
