import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Chip,
  Card,
  RadioButton,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMedicineStore } from '@/stores/useMedicineStore';
import { Schedule, DailyTime, RepeatType, FrequencyType, MealLabel } from '@/types/schedule';
import { Medicine } from '@/types/medicine';

/**
 * AddScheduleScreen - 添加/编辑用药计划界面
 * 适老化设计 - Soft/pastel风格
 */
export const AddScheduleScreen: React.FC<{ navigation: any; route?: any }> = (
  { navigation, route },
) => {
  const theme = useTheme();
  const { userProfile } = useAuthStore();
  const { medicines, fetchMedicines } = useMedicineStore();
  const { addSchedule, updateSchedule, isLoading, error, clearError } = useScheduleStore();

  const editMode = !!route?.params?.scheduleId;

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showMedicineSelector, setShowMedicineSelector] = useState(false);

  const [formData, setFormData] = useState({
    medicineId: '',
    repeatType: 'daily' as RepeatType,
    repeatValue: 1,
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'once' as FrequencyType,
    endDate: '',
    notes: '',
  });

  const [weekdays, setWeekdays] = useState<number[]>([]);

  const [dailyTimes, setDailyTimes] = useState<DailyTime[]>([{ hour: 8, minute: 0 }]);

  const timeEditor = useState<DailyTime | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchMedicines(userProfile.familyId);
    }
  }, [userProfile, fetchMedicines]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData((prev) => ({ ...prev, medicineId: medicine.id }));
    setShowMedicineSelector(false);
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => {
      const exists = prev.includes(day);
      return exists ? prev.filter((d) => d !== day) : [...prev, day].sort();
    });
  };

  const addTime = () => {
    setDailyTimes((prev) => [...prev, { hour: 8, minute: 0 }]);
  };

  const removeTime = (index: number) => {
    if (dailyTimes.length > 1) {
      setDailyTimes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index: number, field: 'hour' | 'minute', value: number) => {
    setDailyTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = { ...newTimes[index], [field]: value };
      return newTimes;
    });
  };

  const updateTimeMealLabel = (index: number, label: MealLabel | undefined) => {
    setDailyTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = { ...newTimes[index], mealLabel: label };
      return newTimes;
    });
  };

  const updateTimeDosage = (index: number, dosage: string) => {
    setDailyTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = { ...newTimes[index], dosage: dosage || undefined };
      return newTimes;
    });
  };

  const validateForm = (): boolean => {
    if (!selectedMedicine) {
      Alert.alert('错误', '请选择药品');
      return false;
    }
    if (formData.repeatType === 'weekly' && weekdays.length === 0) {
      Alert.alert('错误', '请至少选择一天');
      return false;
    }
    if (dailyTimes.length === 0) {
      Alert.alert('错误', '请至少添加一个服药时间');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userProfile?.familyId) {
      Alert.alert('错误', '请先创建或加入家庭组');
      return;
    }

    try {
      await addSchedule(
        userProfile.familyId,
        selectedMedicine!.id,
        selectedMedicine!.name,
        selectedMedicine!.dosage,
        selectedMedicine!.unit || '片',
        formData.repeatType,
        formData.startDate,
        formData.frequency,
        dailyTimes,
        formData.repeatType === 'monthly' ? formData.repeatValue : undefined,
        formData.repeatType === 'weekly' ? weekdays : undefined,
        formData.endDate || undefined,
        formData.notes || undefined
      );

      Alert.alert('成功', editMode ? '用药计划已更新' : '用药计划已创建', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const renderMedicineSelector = () => {
    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          选择药品 *
        </Text>

        {showMedicineSelector ? (
          <ScrollView style={styles.medicineList}>
            {medicines.map((medicine) => (
              <Card
                key={medicine.id}
                style={styles.medicineCard}
                onPress={() => handleMedicineSelect(medicine)}
              >
                <Card.Content style={styles.medicineCardContent}>
                  <View style={styles.medicineRow}>
                    <Text variant="titleMedium" style={styles.medicineName}>
                      {medicine.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.medicineDosage}>
                      {medicine.dosage} × {medicine.unit}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        ) : selectedMedicine ? (
          <Card style={styles.selectedMedicineCard}>
            <Card.Content style={styles.selectedMedicineContent}>
              <Text variant="titleMedium" style={styles.medicineName}>
                {selectedMedicine.name}
              </Text>
              <Text variant="bodyLarge" style={styles.medicineDosage}>
                {selectedMedicine.dosage} × {selectedMedicine.unit}
              </Text>
              {selectedMedicine.boxSlot && (
                <Chip
                  mode="flat"
                  style={styles.slotChip}
                  textStyle={{ fontSize: 14 }}
                  icon="grid"
                >
                  {selectedMedicine.boxSlot}号格
                </Chip>
              )}
            </Card.Content>
          </Card>
        ) : (
          <Button
            mode="outlined"
            onPress={() => setShowMedicineSelector(true)}
            style={styles.selectButton}
            contentStyle={styles.buttonContent}
            icon="pill"
          >
            选择药品
          </Button>
        )}
      </View>
    );
  };

  const renderRepeatSettings = () => {
    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          重复设置
        </Text>

        <View style={styles.repeatOptions}>
          {(['daily', 'weekly', 'monthly', 'course'] as RepeatType[]).map((type) => (
            <Chip
              key={type}
              mode="outlined"
              selected={formData.repeatType === type}
              onPress={() => setFormData((prev) => ({ ...prev, repeatType: type }))}
              style={[styles.repeatChip, formData.repeatType === type && styles.selectedChip]}
              textStyle={styles.chipText}
            >
              {useScheduleStore.getState().getRepeatLabel(type)}
            </Chip>
          ))}
        </View>

        {formData.repeatType === 'weekly' && (
          <View style={styles.weekdaysContainer}>
            <Text variant="bodyMedium" style={styles.weekdaysLabel}>
              选择星期：
            </Text>
            <View style={styles.weekdaysRow}>
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => {
                const isSelected = weekdays.includes(index);
                return (
                  <Chip
                    key={index}
                    mode={isSelected ? 'flat' : 'outlined'}
                    onPress={() => toggleWeekday(index)}
                    style={[styles.weekdayChip, isSelected && styles.selectedWeekdayChip]}
                    textStyle={{ fontSize: 18, fontWeight: '600' }}
                  >
                    {day}
                  </Chip>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.dateRow}>
          <View style={styles.halfInput}>
            <Text variant="bodyMedium" style={styles.dateLabel}>
              开始日期 *
            </Text>
            <Card style={styles.dateCard}>
              <Card.Content style={styles.dateCardContent}>
                <Text variant="titleMedium">{formData.startDate}</Text>
              </Card.Content>
            </Card>
          </View>

          {formData.repeatType === 'course' && (
            <View style={styles.halfInput}>
              <Text variant="bodyMedium" style={styles.dateLabel}>
                结束日期
              </Text>
              <Card style={styles.dateCard}>
                <Card.Content style={styles.dateCardContent}>
                  <Text variant="titleMedium">
                    {formData.endDate || '不设限'}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimeSettings = () => {
    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          服药时间
        </Text>

        {dailyTimes.map((time, index) => (
          <Card key={index} style={styles.timeCard}>
            <Card.Content>
              <View style={styles.timeHeader}>
                <Text variant="titleMedium">第 {index + 1} 次</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => removeTime(index)}
                  disabled={dailyTimes.length === 1}
                />
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text variant="bodyMedium" style={styles.timeLabel}>
                    小时（0-23）
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={String(time.hour)}
                    onChangeText={(text) => updateTime(index, 'hour', parseInt(text, 10) || 0)}
                    keyboardType="number-pad"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                  />
                </View>
                <Text variant="headlineLarge" style={styles.timeColon}>:</Text>
                <View style={styles.timeInput}>
                  <Text variant="bodyMedium" style={styles.timeLabel}>
                    分钟（0-59）
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={String(time.minute)}
                    onChangeText={(text) => updateTime(index, 'minute', parseInt(text, 10) || 0)}
                    keyboardType="number-pad"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                  />
                </View>
              </View>

              <View style={styles.mealSection}>
                <Text variant="bodyMedium" style={styles.mealLabel}>
                  用餐标签：
                </Text>
                <View style={styles.mealChips}>
                  {([
                    undefined,
                    'before_meal',
                    'after_meal',
                    'with_meal',
                    'no_meal',
                  ] as (MealLabel | undefined)[]).map((label) => {
                    let labelName = '不限';
                    if (label === 'before_meal') labelName = '饭前';
                    if (label === 'after_meal') labelName = '饭后';
                    if (label === 'with_meal') labelName = '饭后即刻';
                    if (label === 'no_meal') labelName = '不限';

                    const isSelected = time.mealLabel === label;
                    return (
                      <Chip
                        key={label || 'none'}
                        mode={isSelected ? 'flat' : 'outlined'}
                        onPress={() => updateTimeMealLabel(index, label)}
                        style={[styles.mealChip, isSelected && styles.selectedChip]}
                        textStyle={styles.chipText}
                      >
                        {labelName}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              <View style={styles.dosageSection}>
                <TextInput
                  label={`该时段剂量（默认：${selectedMedicine?.dosage || '未设置'}）`}
                  value={time.dosage || ''}
                  onChangeText={(text) => updateTimeDosage(index, text)}
                  mode="outlined"
                  placeholder={`输入剂量，如：${selectedMedicine?.dosage || '1片'}`}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="outlined"
          onPress={addTime}
          style={styles.addTimeButton}
          contentStyle={styles.buttonContent}
          icon="plus"
        >
          添加服药时间
        </Button>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Toolbar
            title={editMode ? '编辑用药计划' : '创建用药计划'}
            onBack={() => navigation.goBack()}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderMedicineSelector()}
          {renderRepeatSettings()}
          {renderTimeSettings()}

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              备注
            </Text>
            <TextInput
              label="补充说明"
              value={formData.notes}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="记录其他重要信息"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            loading={isLoading}
            disabled={isLoading}
            icon="check"
          >
            {editMode ? '保存' : '创建'}
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#FAFAFA',
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 16,
  },

  // 药品选择
  medicineList: {
    maxHeight: 300,
  },
  medicineCard: {
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  medicineCardContent: {
    padding: 12,
  },
  medicineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
  },
  medicineDosage: {
    fontSize: 16,
    color: '#757575',
  },
  selectedMedicineCard: {
    backgroundColor: '#FFF3E0',
  },
  selectedMedicineContent: {
    padding: 16,
    gap: 8,
  },
  slotChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
  },
  selectButton: {
    borderColor: '#BDBDBD',
  },

  // 重复设置
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  repeatChip: {
    backgroundColor: '#FAFAFA',
    borderColor: '#BDBDBD',
  },
  selectedChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#29B6F6',
  },
  chipText: {
    fontSize: 16,
  },
  weekdaysContainer: {
    marginTop: 16,
  },
  weekdaysLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 12,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayChip: {
    backgroundColor: '#FAFAFA',
  },
  selectedWeekdayChip: {
    backgroundColor: '#29B6F6',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  halfInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  dateCard: {
    backgroundColor: '#FAFAFA',
  },
  dateCardContent: {
    padding: 12,
  },

  // 时间设置
  timeCard: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  timeColon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#29B6F6',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputContent: {
    fontSize: 16,
    minHeight: 56,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  mealChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealChip: {
    backgroundColor: '#FAFAFA',
  },
  dosageSection: {
    marginTop: 8,
  },
  addTimeButton: {
    borderColor: '#BDBDBD',
  },

  // 底部操作栏
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#BDBDBD',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#29B6F6',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
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
