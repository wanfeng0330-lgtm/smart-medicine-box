import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
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
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { useMedicineStore, getContraindicationLabels } from '@/stores/useMedicineStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Medicine } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';

/**
 * MedicinesScreen - 药品管理界面
 * 适老化设计 - Soft/pastel风格
 */
export const MedicinesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuthStore();
  const {
    medicines,
    fetchMedicines,
    deleteMedicine,
    assignBoxSlot,
    unassignBoxSlot,
    isLoading,
    error,
    clearError,
  } = useMedicineStore();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showBoxSlotDialog, setShowBoxSlotDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // 加载药品列表
  useEffect(() => {
    if (userProfile?.familyId) {
      fetchMedicines(userProfile.familyId);
    }
  }, [userProfile, fetchMedicines]);

  // 显示错误
  useEffect(() => {
    if (error) {
      // 显示错误提示...（可以有简单的alert或者Toast）
      console.error('Error:', error);
      clearError();
    }
  }, [error, clearError]);

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    if (userProfile?.familyId) {
      await fetchMedicines(userProfile.familyId);
    }
    setRefreshing(false);
  };

  // 处理删除药品
  const handleDeleteMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDeleteDialog(true);
    setMenuVisible(null);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!selectedMedicine) return;

    try {
      await deleteMedicine(selectedMedicine.id);
      setShowDeleteDialog(false);
      setSelectedMedicine(null);
      // 显示成功提示
      console.log('药品已删除');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // 取消药盒格分配
  const handleUnassignSlot = async (medicine: Medicine) => {
    if (medicine.boxSlot) {
      await unassignBoxSlot(medicine.id);
    }
    setMenuVisible(null);
  };

  // 分配药盒格
  const handleAssignSlot = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setSelectedSlot(medicine.boxSlot || null);
    setShowBoxSlotDialog(true);
    setMenuVisible(null);
  };

  // 确认分配药盒格
  const confirmAssignSlot = async () => {
    if (!selectedMedicine || selectedSlot === null) return;

    try {
      await assignBoxSlot(selectedMedicine.id, selectedSlot);
      setShowBoxSlotDialog(false);
      setSelectedMedicine(null);
      setSelectedSlot(null);
      console.log('药盒格分配成功');
    } catch (error) {
      console.error('Assign slot failed:', error);
    }
  };

  // 渲染药品卡片
  const renderMedicineCard = ({ item }: { item: Medicine }) => {
    const { id, name, description, dosage, stock, unit, boxSlot, contraindications } = item;

    // 卡片状态颜色
    const isLowStock = stock < 5;

    return (
      <Card
        key={id}
        style={[
          styles.medicineCard,
          isLowStock && styles.lowStockCard,
        ]}
        elevation={2}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.medicineAvatarArea}>
              <Avatar.Text
                size={56}
                label={name.charAt(0).toUpperCase()}
                style={[
                  styles.medicineAvatar,
                  isLowStock && styles.lowStockAvatar,
                ]}
              />
              <View style={[
                styles.statusBadge,
                isLowStock && styles.lowStockBadge,
              ]}>
                <Text style={styles.statusText}>
                  {isLowStock ? '库存低' : '正常'}
                </Text>
              </View>
            </View>

            <View style={styles.menuButton}>
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
                  onPress={() => {
                    setMenuVisible(null);
                    navigation.navigate('MedicineDetail', { medicineId: id });
                  }}
                  title="编辑"
                  titleStyle={{ fontSize: 18 }}
                />
                <Menu.Item
                  leadingIcon="cog"
                  onPress={() => {
                    handleAssignSlot(item);
                  }}
                  title="分配药盒格"
                  titleStyle={{ fontSize: 18 }}
                />
                {boxSlot && (
                  <Menu.Item
                    leadingIcon="close-circle"
                    onPress={() => {
                      handleUnassignSlot(item);
                    }}
                    title="解除药盒格"
                    titleStyle={{ fontSize: 18 }}
                  />
                )}
                <Menu.Item
                  leadingIcon="delete"
                  onPress={() => handleDeleteMedicine(item)}
                  titleStyle={{ fontSize: 18, color: theme.colors.error }}
                  title="删除"
                />
              </Menu>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.medicineName}>
            {name}
          </Text>

          {description && (
            <Text variant="bodyLarge" style={styles.description}>
              {description}
            </Text>
          )}

          <View style={styles.infoSection}>
            <View>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                剂量
              </Text>
              <Text variant="headlineSmall" style={styles.infoValue}>
                {dosage} × {stock} {unit}
              </Text>
            </View>

            {boxSlot && (
              <View>
                <Text variant="bodyMedium" style={styles.infoLabel}>
                  药盒格
                </Text>
              <View style={styles.slotBadge}>
                <Text variant="bodyLarge" style={styles.slotBadgeText}>
                  {boxSlot}号格
                </Text>
              </View>
              </View>
            )}
          </View>

          {contraindications.length > 0 && (
            <View style={styles.contraindicationsSection}>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                用药禁忌：
              </Text>
              <View style={styles.contraindicationChips}>
                {contraindications.map((type, index) => (
                  <Chip
                    key={index}
                    icon="alert-circle"
                    mode="flat"
                    style={styles.contraindicationChip}
                    textStyle={{ fontSize: 16 }}
                  >
                    {getContraindicationLabels([type])[0]}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // 空状态（没有药品）
  if (medicines.length === 0) {
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
              icon="pill"
              style={styles.emptyIcon}
              color={theme.colors.primary}
            />
            <Text variant="headlineLarge" style={styles.emptyTitle}>
              还没有药品
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              添加您的第一个药品，开始管理家庭用药
            </Text>

            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('AddMedicine')}
              style={styles.emptyButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              添加药品
            </Button>
          </View>
        </ScrollView>

        <LoadingSpinner loading={isLoading} />
      </View>
    );
  }

  // 药品列表视图
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={medicines}
        renderItem={renderMedicineCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <Divider style={styles.separator} />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine')}
      />

      <LoadingSpinner loading={isLoading} />

      {/* 删除确认对话框 */}
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
              确定要删除药品"{selectedMedicine?.name}"吗？
              删除后相关用药计划也会受影响。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} labelStyle={styles.dialogButtonLabel}>
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

      {/* 药盒格对话框 */}
      <Portal>
        <Dialog
          visible={showBoxSlotDialog}
          onDismiss={() => setShowBoxSlotDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            配置药盒格号
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              为"{selectedMedicine?.name}"选择药盒格号（1-8）
            </Text>

            <View style={styles.boxSlotGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
                <Button
                  key={slot}
                  mode={selectedSlot === slot ? 'contained' : 'outlined'}
                  onPress={() => setSelectedSlot(slot)}
                  style={[styles.slotButton, selectedSlot === slot && styles.selectedSlotButton]}
                  contentStyle={styles.slotButtonContent}
                  labelStyle={{ fontSize: 20 }}
                >
                  {slot}
                </Button>
              ))}
            </View>

            <View style={styles.slotHint}>
              {selectedSlot && (
                <Text variant="bodyMedium" style={styles.slotHintText}>
                  当前: {selectedSlot}号格
                </Text>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBoxSlotDialog(false)} labelStyle={styles.dialogButtonLabel}>
              取消
            </Button>
            <Button
              onPress={confirmAssignSlot}
              mode="contained"
              labelStyle={styles.dialogButtonLabel}
              disabled={selectedSlot === null}
            >
              确认
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
  listContent: { flexGrow: 1, padding: 16 },
  separator: { height: 8 },
  listEmpty: { paddingVertical: 40, alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  content: { padding: 24 },

  // 空状态
  emptyIcon: {
    backgroundColor: '#FFE0B2',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    color: '#37474F',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    color: '#666666',
  },
  emptyButton: {
    paddingHorizontal: 32,
  },

  // 药品卡片
  medicineCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  lowStockCard: {
    backgroundColor: '#FFF3E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    alignSelf: 'flex-start',
  },
  medicineAvatarArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicineAvatar: {
    backgroundColor: '#FFA726',
    color: '#FFFFFF',
  },
  lowStockAvatar: {
    backgroundColor: '#FFB74D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#66BB6A',
  },
  lowStockBadge: {
    backgroundColor: '#FFB74D',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  medicineName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 22,
  },
  infoSection: {
    gap: 16,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F',
  },
  slotBadge: {
    backgroundColor: '#29B6F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 禁忌部分
  contraindicationsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  contraindicationChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  contraindicationChip: {
    backgroundColor: '#FFEBEE',
  },

  // 底部FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#FFA726',
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
    marginBottom: 16,
    color: '#666666',
  },
  dialogButtonLabel: {
    fontSize: 18,
    paddingHorizontal: 16,
  },

  // 药盒格选择
  boxSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  slotButton: {
    backgroundColor: '#E3F2FD',
  },
  selectedSlotButton: {
    backgroundColor: '#FFA726',
  },
  slotButtonContent: {
    width: 70,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotHint: {
    marginTop: 16,
    textAlign: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  slotHintText: {
    fontSize: 16,
    color: '#1976D2',
    textAlign: 'center',
  },

  // 通用按钮
  buttonContent: {
    height: 56,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});
