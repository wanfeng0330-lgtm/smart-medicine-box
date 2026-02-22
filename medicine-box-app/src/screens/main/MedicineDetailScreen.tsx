import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  IconButton,
  Divider,
  useTheme,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { CONTRAINDICATION_LABELS, ContraindicationType } from '@/types/medicine';
import { Medicine } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';

/**
 * MedicineDetailScreen - 药品详情界面
 * 适老化设计 - Soft/pastel风格
 */
export const MedicineDetailScreen: React.FC<{ navigation: any; route: any }> = (
  { navigation, route },
) => {
  const theme = useTheme();
  const { medicine } = route.params;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const {
    deleteMedicine,
    isLoading,
    error,
    clearError,
  } = useCloudBaseMedicineStore();

  const {
    id,
    name,
    description,
    barcode,
    dosage,
    stock,
    unit,
    boxSlot,
    prescriptionUrl,
    contraindications,
    notes,
    expiryDate,
    manufacturer,
  } = medicine;

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  const isLowStock = stock < 5;

  const handleEdit = () => {
    navigation.navigate('AddMedicine', { medicine });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsLoadingDelete(true);
    try {
      await deleteMedicine(id);
      setShowDeleteDialog(false);
      Alert.alert('成功', '药品已删除', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('错误', '删除失败，请重试');
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const renderHeader = () => {
    return (
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Toolbar
          title="药品详情"
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  };

  const renderInfoCard = () => {
    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.medicineHeader}>
            <Avatar.Text
              size={72}
              label={name.charAt(0).toUpperCase()}
              style={[
                styles.medicineAvatar,
                isLowStock && styles.lowStockAvatar,
              ]}
              labelStyle={styles.avatarText}
            />
            <View style={[styles.statusBadge, isLowStock && styles.lowStockBadge]}>
              <Text style={styles.statusText}>
                {isLowStock ? '库存低' : '正常'}
              </Text>
            </View>
          </View>

          <Text variant="headlineLarge" style={styles.medicineName}>
            {name}
          </Text>

          {description && (
            <Text variant="bodyLarge" style={styles.description}>
              {description}
            </Text>
          )}

          <View style={styles.divider} />

          {/* 基本信息 */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                剂量
              </Text>
              <Text variant="headlineSmall" style={styles.infoValue}>
                {dosage}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                库存
              </Text>
              <Text variant="headlineSmall" style={[styles.infoValue, isLowStock && styles.lowStockText]}>
                {stock} {unit}
              </Text>
            </View>

            {boxSlot && (
              <View style={styles.infoItem}>
                <Text variant="bodyMedium" style={styles.infoLabel}>
                  药盒格
                </Text>
                <View style={styles.slotBadge}>
                  <Text variant="headlineSmall" style={styles.slotBadgeText}>
                    {boxSlot}号格
                  </Text>
                </View>
              </View>
            )}

            {barcode && (
              <View style={styles.infoItem}>
                <Text variant="bodyMedium" style={styles.infoLabel}>
                  条形码
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {barcode}
                </Text>
              </View>
            )}

            {expiryDate && (
              <View style={styles.infoItem}>
                <Text variant="bodyMedium" style={styles.infoLabel}>
                  有效期
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {expiryDate}
                </Text>
              </View>
            )}

            {manufacturer && (
              <View style={styles.infoItem}>
                <Text variant="bodyMedium" style={styles.infoLabel}>
                  生产厂家
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {manufacturer}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderContraindicationsCard = () => {
    if (!contraindications || contraindications.length === 0) return null;

    const labels = contraindications.map((type: ContraindicationType) => CONTRAINDICATION_LABELS[type]);

    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            用药禁忌
          </Text>

          <View style={styles.chipsContainer}>
            {labels.map((label: string, index: number) => (
              <Chip
                key={index}
                icon="alert-circle"
                mode="flat"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPrescriptionCard = () => {
    if (!prescriptionUrl) return null;

    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            处方照片
          </Text>

          <Avatar.Image
            size={200}
            source={{ uri: prescriptionUrl }}
            style={styles.imagePreview}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderNotesCard = () => {
    if (!notes) return null;

    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            备注
          </Text>

          <Text variant="bodyLarge" style={styles.notesText}>
            {notes}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderInfoCard()}
        {renderContraindicationsCard()}
        {renderPrescriptionCard()}
        {renderNotesCard()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleEdit}
          style={styles.editButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="pencil"
        >
          编辑
        </Button>

        <Button
          mode="contained"
          onPress={handleDelete}
          style={styles.deleteButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="delete"
          buttonColor="#EF5350"
        >
          删除
        </Button>
      </View>

      <LoadingSpinner loading={isLoading} />

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={[styles.dialog, { backgroundColor: '#FFFFFF' }]}
        >
          <Dialog.Title style={styles.dialogTitle}>
            确认删除？
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              确定要删除药品"{name}"吗？
              删除后相关用药计划也会受影响。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDeleteDialog(false)}
              labelStyle={styles.dialogButtonLabel}
              disabled={isLoadingDelete}
            >
              取消
            </Button>
            <Button
              onPress={confirmDelete}
              mode="contained"
              buttonColor="#EF5350"
              labelStyle={styles.dialogButtonLabel}
              loading={isLoadingDelete}
              disabled={isLoadingDelete}
            >
              确认删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

// 工具栏组件
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
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 16,
  },

  // 药品头部
  medicineHeader: {
    marginBottom: 16,
  },
  medicineAvatar: {
    backgroundColor: '#FFA726',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  lowStockAvatar: {
    backgroundColor: '#FFB74D',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#66BB6A',
  },
  lowStockBadge: {
    backgroundColor: '#FFB74D',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  medicineName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },

  // 信息网格
  infoGrid: {
    gap: 20,
  },
  infoItem: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
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
  lowStockText: {
    color: '#EF5350',
  },
  slotBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#29B6F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // 禁忌标签
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: 16,
  },

  // 处方图片
  imagePreview: {
    backgroundColor: '#F5F5F5',
  },

  // 备注
  notesText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
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
  editButton: {
    flex: 1,
    borderColor: '#BDBDBD',
  },
  deleteButton: {
    flex: 1,
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
