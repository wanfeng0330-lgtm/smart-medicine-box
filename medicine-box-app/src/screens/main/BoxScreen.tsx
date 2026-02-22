import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Portal,
  Dialog,
  Chip,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { Medicine } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';
import APP_CONFIG from '@/config/appConfig';
import { formatDosage } from '@/utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLOT_COUNT = APP_CONFIG.BOX_SLOT_COUNT;
const SLOT_MARGIN = 8;
const CONTAINER_PADDING = 20;
const BOX_PADDING = 16;
const SLOTS_PER_ROW = 4;

const calculateSlotWidth = () => {
  const availableWidth = SCREEN_WIDTH - (CONTAINER_PADDING * 2) - (BOX_PADDING * 2) - (SLOT_MARGIN * (SLOTS_PER_ROW - 1));
  return availableWidth / SLOTS_PER_ROW;
};

export const BoxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const {
    medicines,
    fetchMedicines,
    assignBoxSlot,
    unassignBoxSlot,
    isLoading,
    error,
    clearError,
  } = useCloudBaseMedicineStore();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [slotMedicines, setSlotMedicines] = useState<(Medicine | null)[]>([]);

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchMedicines(userProfile.familyId);
    }
  }, [userProfile, fetchMedicines]);

  useEffect(() => {
    const slots: (Medicine | null)[] = Array(SLOT_COUNT).fill(null);
    medicines.forEach((med) => {
      if (med.boxSlot && med.boxSlot >= 1 && med.boxSlot <= 8) {
        slots[med.boxSlot - 1] = med;
      }
    });
    setSlotMedicines(slots);
  }, [medicines]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  const handleSlotPress = (slotNumber: number) => {
    setSelectedSlot(slotNumber);
    setShowAssignDialog(true);
  };

  const getUnassignedMedicines = (): Medicine[] => {
    return medicines.filter((m) => !m.boxSlot);
  };

  const handleAssignMedicine = async (medicine: Medicine) => {
    if (!selectedSlot) return;

    try {
      const existingMedicine = slotMedicines[selectedSlot - 1];
      if (existingMedicine) {
        await unassignBoxSlot(existingMedicine.id);
      }
      await assignBoxSlot(medicine.id, selectedSlot);
      setShowAssignDialog(false);
      setSelectedSlot(null);
    } catch (error) {
      Alert.alert('错误', '分配失败');
    }
  };

  const handleUnassignSlot = async () => {
    if (!selectedSlot) return;

    const medicine = slotMedicines[selectedSlot - 1];
    if (!medicine) {
      setShowAssignDialog(false);
      setSelectedSlot(null);
      return;
    }

    try {
      await unassignBoxSlot(medicine.id);
      setShowAssignDialog(false);
      setSelectedSlot(null);
    } catch (error) {
      Alert.alert('错误', '取消分配失败');
    }
  };

  const getSlotStatus = (slotNumber: number) => {
    const medicine = slotMedicines[slotNumber - 1];
    if (!medicine) {
      return { status: 'empty', color: COLORS.border, label: '空' };
    }
    if (medicine.stock === 0) {
      return { status: 'empty-stock', color: COLORS.error, label: '缺货' };
    }
    if (medicine.stock <= 5) {
      return { status: 'low', color: COLORS.warning, label: '不足' };
    }
    return { status: 'normal', color: COLORS.success, label: '充足' };
  };

  const usedSlots = slotMedicines.filter((m) => m !== null).length;
  const emptySlots = SLOT_COUNT - usedSlots;

  const selectedMedicine = selectedSlot ? slotMedicines[selectedSlot - 1] : null;
  const unassignedMedicines = getUnassignedMedicines();

  const SLOT_WIDTH = calculateSlotWidth();

  const renderSlot = (slotNumber: number) => {
    const medicine = slotMedicines[slotNumber - 1];
    const slotStatus = getSlotStatus(slotNumber);

    return (
      <Card
        key={slotNumber}
        style={[
          styles.slotCard,
          { 
            width: SLOT_WIDTH,
            borderColor: slotStatus.color,
          },
        ]}
        onPress={() => handleSlotPress(slotNumber)}
        elevation={2}
      >
        <View style={styles.slotContent}>
          <View style={[styles.slotNumber, { backgroundColor: slotStatus.color }]}>
            <Text style={styles.slotNumberText}>{slotNumber}</Text>
          </View>

          {medicine ? (
            <View style={styles.slotMedicineInfo}>
              <Avatar.Text
                size={36}
                label={medicine.name.charAt(0).toUpperCase()}
                style={[styles.medicineAvatar, { backgroundColor: slotStatus.color + '30' }]}
                labelStyle={[styles.medicineAvatarLabel, { color: slotStatus.color }]}
              />
              <Text style={styles.medicineName} numberOfLines={1}>
                {medicine.name}
              </Text>
              <View style={[styles.stockBadge, { backgroundColor: slotStatus.color + '20' }]}>
                <Text style={[styles.stockText, { color: slotStatus.color }]}>
                  {formatDosage(String(medicine.stock), medicine.unit || '片')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.slotEmpty}>
              <IconButton
                icon="plus-circle-outline"
                size={28}
                iconColor={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>点击分配</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderLegend = () => (
    <Card style={styles.legendCard} elevation={1}>
      <Card.Content>
        <Text style={styles.legendTitle}>状态说明</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>库存充足</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>库存不足</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>已缺货</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderUnassignedSection = () => {
    if (unassignedMedicines.length === 0) return null;

    return (
      <View style={styles.unassignedSection}>
        <Text style={styles.sectionTitle}>待分配药品</Text>
        <Text style={styles.sectionSubtitle}>
          以下药品尚未分配到药盒格子
        </Text>
        <View style={styles.unassignedList}>
          {unassignedMedicines.map((medicine) => (
            <Card
              key={medicine.id}
              style={styles.unassignedCard}
              onPress={() => {
                Alert.alert(
                  '分配药品',
                  `将"${medicine.name}"分配到哪个格子？`,
                  [
                    { text: '取消', style: 'cancel' },
                    ...Array.from({ length: 8 }, (_, i) => ({
                      text: `${i + 1}号格`,
                      onPress: async () => {
                        try {
                          const existingMedicine = slotMedicines[i];
                          if (existingMedicine) {
                            await unassignBoxSlot(existingMedicine.id);
                          }
                          await assignBoxSlot(medicine.id, i + 1);
                        } catch (error) {
                          Alert.alert('错误', '分配失败');
                        }
                      },
                    })),
                  ]
                );
              }}
              elevation={1}
            >
              <Card.Content style={styles.unassignedCardContent}>
                <Avatar.Text
                  size={36}
                  label={medicine.name.charAt(0).toUpperCase()}
                  style={styles.unassignedAvatar}
                  labelStyle={styles.unassignedAvatarLabel}
                />
                <View style={styles.unassignedInfo}>
                  <Text style={styles.unassignedName}>{medicine.name}</Text>
                  <Text style={styles.unassignedStock}>
                    库存: {formatDosage(String(medicine.stock), medicine.unit)}
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} iconColor={COLORS.textSecondary} />
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>
    );
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
            <Text style={styles.headerTitle}>我的药盒</Text>
            <Text style={styles.headerSubtitle}>8格智能药盒管理</Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="grid"
            style={styles.headerIcon}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{usedSlots}</Text>
            <Text style={styles.statLabel}>已占用</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{emptySlots}</Text>
            <Text style={styles.statLabel}>空闲</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{medicines.length}</Text>
            <Text style={styles.statLabel}>药品总数</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boxContainer}>
          <View style={styles.boxRow}>
            {[1, 2, 3, 4].map((slot) => (
              <View key={slot} style={{ marginRight: slot < 4 ? SLOT_MARGIN : 0 }}>
                {renderSlot(slot)}
              </View>
            ))}
          </View>
          <View style={styles.boxDivider} />
          <View style={styles.boxRow}>
            {[5, 6, 7, 8].map((slot) => (
              <View key={slot} style={{ marginRight: slot < 8 ? SLOT_MARGIN : 0 }}>
                {renderSlot(slot)}
              </View>
            ))}
          </View>
        </View>

        {renderLegend()}
        {renderUnassignedSection()}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showAssignDialog}
          onDismiss={() => setShowAssignDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {selectedSlot}号格子
          </Dialog.Title>
          <Dialog.Content>
            {selectedMedicine ? (
              <View style={styles.dialogMedicineInfo}>
                <Avatar.Text
                  size={64}
                  label={selectedMedicine.name.charAt(0).toUpperCase()}
                  style={styles.dialogAvatar}
                  labelStyle={styles.dialogAvatarLabel}
                />
                <Text style={styles.dialogMedicineName}>{selectedMedicine.name}</Text>
                <Text style={styles.dialogMedicineDosage}>
                  {formatDosage(selectedMedicine.dosage, selectedMedicine.unit || '片')}
                </Text>
                <Text style={styles.dialogMedicineStock}>
                  库存: {formatDosage(String(selectedMedicine.stock), selectedMedicine.unit || '片')}
                </Text>

                <Button
                  mode="outlined"
                  onPress={handleUnassignSlot}
                  style={styles.unassignButton}
                  textColor={COLORS.error}
                  icon="link-variant-off"
                >
                  取消分配
                </Button>
              </View>
            ) : (
              <View>
                <Text style={styles.dialogEmptyText}>选择要分配的药品：</Text>

                {unassignedMedicines.length > 0 ? (
                  <ScrollView style={styles.medicineList}>
                    {unassignedMedicines.map((medicine) => (
                      <Card
                        key={medicine.id}
                        style={styles.medicineItem}
                        onPress={() => handleAssignMedicine(medicine)}
                        elevation={0}
                      >
                        <Card.Content style={styles.medicineItemContent}>
                          <Avatar.Text
                            size={40}
                            label={medicine.name.charAt(0).toUpperCase()}
                            style={styles.medicineItemAvatar}
                            labelStyle={styles.medicineItemAvatarLabel}
                          />
                          <View style={styles.medicineItemInfo}>
                            <Text style={styles.medicineItemName}>{medicine.name}</Text>
                            <Text style={styles.medicineItemDosage}>
                              {formatDosage(medicine.dosage, medicine.unit)} · 库存: {medicine.stock}
                            </Text>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noMedicines}>
                    <Avatar.Icon
                      size={48}
                      icon="pill"
                      style={styles.noMedicinesIcon}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.noMedicinesText}>暂无待分配药品</Text>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setShowAssignDialog(false);
                        navigation.navigate('AddMedicine');
                      }}
                      style={styles.addMedicineButton}
                      buttonColor={COLORS.primary}
                    >
                      添加药品
                    </Button>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAssignDialog(false)} textColor={COLORS.textSecondary}>
              关闭
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Lato_Regular',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Nunito_ExtraBold',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Lato_Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  boxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: BOX_PADDING,
    marginBottom: 16,
    ...SHADOWS.large,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  boxDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  slotCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  slotContent: {
    padding: 10,
    alignItems: 'center',
    minHeight: 110,
  },
  slotNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  slotNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito_Bold',
  },

  slotMedicineInfo: {
    alignItems: 'center',
    flex: 1,
  },
  medicineAvatar: {
    marginBottom: 6,
  },
  medicineAvatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  medicineName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  slotEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  legendCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  unassignedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 12,
  },
  unassignedList: {
    gap: 8,
  },
  unassignedCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  unassignedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  unassignedAvatar: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  unassignedAvatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Nunito_Bold',
  },
  unassignedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  unassignedName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  unassignedStock: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  dialog: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  dialogMedicineInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dialogAvatar: {
    backgroundColor: COLORS.primaryLight + '30',
    marginBottom: 12,
  },
  dialogAvatarLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Nunito_Bold',
  },
  dialogMedicineName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 4,
  },
  dialogMedicineDosage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 8,
  },
  dialogMedicineStock: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Lato_Medium',
    marginBottom: 16,
  },
  unassignButton: {
    borderRadius: 16,
    borderColor: COLORS.error,
  },
  dialogEmptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 16,
  },
  medicineList: {
    maxHeight: 300,
  },
  medicineItem: {
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  medicineItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  medicineItemAvatar: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  medicineItemAvatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Nunito_Bold',
  },
  medicineItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medicineItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  medicineItemDosage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  noMedicines: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMedicinesIcon: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  noMedicinesText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 16,
  },
  addMedicineButton: {
    borderRadius: 16,
  },
});
