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
  Searchbar,
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog,
  FAB,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { Medicine } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

type SortType = 'name' | 'stock' | 'expiry';
type FilterType = 'all' | 'low-stock' | 'assigned' | 'unassigned';

export const MedicinesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const {
    medicines,
    fetchMedicines,
    deleteMedicine,
    isLoading,
    error,
    clearError,
  } = useCloudBaseMedicineStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

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

  const onRefresh = async () => {
    setRefreshing(true);
    if (userProfile?.familyId) {
      await fetchMedicines(userProfile.familyId);
    }
    setRefreshing(false);
  };

  const getFilteredMedicines = (): Medicine[] => {
    let filtered = [...medicines];

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    switch (filterBy) {
      case 'low-stock':
        filtered = filtered.filter((m) => m.stock <= 5);
        break;
      case 'assigned':
        filtered = filtered.filter((m) => m.boxSlot !== null && m.boxSlot !== undefined);
        break;
      case 'unassigned':
        filtered = filtered.filter((m) => !m.boxSlot);
        break;
    }

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        break;
      case 'stock':
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case 'expiry':
        filtered.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
        break;
    }

    return filtered;
  };

  const handleMedicinePress = (medicine: Medicine) => {
    navigation.navigate('MedicineDetail', { medicine });
  };

  const handleDeleteMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedMedicine) return;

    try {
      await deleteMedicine(selectedMedicine.id);
      setShowDeleteDialog(false);
      setSelectedMedicine(null);
    } catch (error) {
      Alert.alert('错误', '删除失败');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: COLORS.error, label: '缺货' };
    if (stock <= 5) return { color: COLORS.warning, label: '不足' };
    return { color: COLORS.success, label: '充足' };
  };

  const filteredMedicines = getFilteredMedicines();
  const lowStockCount = medicines.filter((m) => m.stock <= 5).length;

  const renderMedicineCard = (medicine: Medicine) => {
    const stockStatus = getStockStatus(medicine.stock);

    return (
      <Card
        key={medicine.id}
        style={styles.medicineCard}
        onPress={() => handleMedicinePress(medicine)}
        elevation={2}
      >
        <Card.Content style={styles.medicineContent}>
          <Avatar.Text
            size={56}
            label={medicine.name.charAt(0).toUpperCase()}
            style={[styles.medicineAvatar, { backgroundColor: stockStatus.color + '30' }]}
            labelStyle={[styles.medicineAvatarLabel, { color: stockStatus.color }]}
          />

          <View style={styles.medicineInfo}>
            <View style={styles.medicineHeader}>
              <Text style={styles.medicineName} numberOfLines={1}>
                {medicine.name}
              </Text>
              {medicine.boxSlot && (
                <Chip mode="flat" style={styles.slotChip} textStyle={styles.slotChipText}>
                  {medicine.boxSlot}号格
                </Chip>
              )}
            </View>

            {medicine.description && (
              <Text style={styles.medicineDescription} numberOfLines={1}>
                {medicine.description}
              </Text>
            )}

            <View style={styles.medicineMeta}>
              <Text style={styles.medicineDosage}>
                {medicine.dosage} · {medicine.stock}{medicine.unit || '片'}
              </Text>
              <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
                <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                  {stockStatus.label}
                </Text>
              </View>
            </View>
          </View>

          <IconButton
            icon="delete"
            size={24}
            iconColor={COLORS.error}
            onPress={() => handleDeleteMedicine(medicine)}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        size={100}
        icon="pill"
        style={styles.emptyIcon}
        color={COLORS.primary}
      />
      <Text style={styles.emptyTitle}>暂无药品</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? '未找到匹配的药品' : '点击下方按钮添加您的第一种药品'}
      </Text>
      {!searchQuery && (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddMedicine')}
          style={styles.emptyButton}
          contentStyle={styles.emptyButtonContent}
          labelStyle={styles.emptyButtonLabel}
          buttonColor={COLORS.primary}
        >
          添加药品
        </Button>
      )}
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
            <Text style={styles.headerTitle}>药品管理</Text>
            <Text style={styles.headerSubtitle}>
              共 {medicines.length} 种药品
              {lowStockCount > 0 && ` · ${lowStockCount}种库存不足`}
            </Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="pill"
            style={styles.headerIcon}
            color="#FFFFFF"
          />
        </View>

        <Searchbar
          placeholder="搜索药品名称或描述..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={COLORS.primary}
          clearIcon="close-circle"
        />
      </LinearGradient>

      <View style={styles.filterBar}>
        <Menu
          visible={showSortMenu}
          onDismiss={() => setShowSortMenu(false)}
          anchor={
            <Chip
              mode="outlined"
              onPress={() => setShowSortMenu(true)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
              icon="sort"
            >
              排序
            </Chip>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            onPress={() => { setSortBy('name'); setShowSortMenu(false); }}
            title="按名称"
            leadingIcon={sortBy === 'name' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => { setSortBy('stock'); setShowSortMenu(false); }}
            title="按库存"
            leadingIcon={sortBy === 'stock' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => { setSortBy('expiry'); setShowSortMenu(false); }}
            title="按有效期"
            leadingIcon={sortBy === 'expiry' ? 'check' : undefined}
          />
        </Menu>

        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <Chip
              mode="outlined"
              onPress={() => setShowFilterMenu(true)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
              icon="filter-variant"
            >
              筛选
            </Chip>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            onPress={() => { setFilterBy('all'); setShowFilterMenu(false); }}
            title="全部"
            leadingIcon={filterBy === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => { setFilterBy('low-stock'); setShowFilterMenu(false); }}
            title="库存不足"
            leadingIcon={filterBy === 'low-stock' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => { setFilterBy('assigned'); setShowFilterMenu(false); }}
            title="已分配"
            leadingIcon={filterBy === 'assigned' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => { setFilterBy('unassigned'); setShowFilterMenu(false); }}
            title="未分配"
            leadingIcon={filterBy === 'unassigned' ? 'check' : undefined}
          />
        </Menu>

        <Chip
          mode="flat"
          style={styles.countChip}
          textStyle={styles.countChipText}
        >
          {filteredMedicines.length} 项
        </Chip>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map(renderMedicineCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine')}
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
              确定要删除药品「{selectedMedicine?.name}」吗？
            </Text>
            <Text style={styles.dialogWarning}>
              删除后相关用药计划也会受影响
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
    marginBottom: 16,
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

  searchBar: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'Lato_Regular',
  },

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Lato_Medium',
  },
  countChip: {
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '30',
    marginLeft: 'auto',
  },
  countChipText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Lato_Medium',
  },

  menuContent: {
    borderRadius: 12,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  medicineCard: {
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  medicineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  medicineAvatar: {
    marginRight: 12,
  },
  medicineAvatarLabel: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    flex: 1,
  },
  slotChip: {
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: COLORS.secondary + '20',
    height: 24,
  },
  slotChipText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: 'Lato_Medium',
  },
  medicineDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 6,
  },
  medicineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineDosage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
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
    marginBottom: 8,
  },
  dialogWarning: {
    fontSize: 14,
    color: COLORS.warning,
    fontFamily: 'Lato_Regular',
  },
});
