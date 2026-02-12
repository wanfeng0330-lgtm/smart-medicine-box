import React, { useState } from 'react';
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
  Avatar,
  IconButton,
  Portal,
  Dialog,
  useTheme,
  Switch,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useMedicineStore } from '@/stores/useMedicineStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ContraindicationType, CONTRAINDICATION_LABELS } from '@/types/medicine';

/**
 * AddMedicineScreen - 添加药品界面
 * 适老化设计 - Soft/pastel风格
 */
export const AddMedicineScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const theme = useTheme();
  const { userProfile } = useAuthStore();
  const { addMedicine, isLoading, error, clearError } = useMedicineStore();
  const editMode = !!route?.params?.medicine;

  // 表单状态
  const [formData, setFormData] = useState({
    name: route?.params?.medicine?.name || '',
    description: route?.params?.medicine?.description || '',
    barcode: route?.params?.medicine?.barcode || '',
    dosage: route?.params?.medicine?.dosage || '1片',
    stock: route?.params?.medicine?.stock?.toString() || '10',
    unit: route?.params?.medicine?.unit || '片',
    contraindications: route?.params?.medicine?.contraindications || [] as ContraindicationType[],
    notes: route?.params?.medicine?.notes || '',
    expiryDate: route?.params?.medicine?.expiryDate || '',
    manufacturer: route?.params?.medicine?.manufacturer || '',
  });

  // 处方图片
  const [prescriptionImage, setPrescriptionImage] = useState<{
    uri: string;
    name: string;
  } | null>(null);

  // 显示错误
  React.useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  // 更新表单字段
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 切换禁忌标签
  const toggleContraindication = (type: ContraindicationType) => {
    setFormData((prev) => {
      const isSelected = prev.contraindications.includes(type);
      const newContraindications = isSelected
        ? prev.contraindications.filter((t: ContraindicationType) => t !== type)
        : [...prev.contraindications, type];
      return { ...prev, contraindications: newContraindications };
    });
  };

  // 选择处方图片
  const pickPrescriptionImage = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPrescriptionImage({
          uri: asset.uri,
          name: asset.fileName || 'prescription.jpg',
        });
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 移除处方图片
  const removePrescriptionImage = () => {
    setPrescriptionImage(null);
  };

  // 上传处方图片占位符
  const uploadPrescriptionLocal = async (familyId: string, medicineName: string, imageUri: string): Promise<string | undefined> => {
    Alert.alert('提示', '处方照片上传功能将在后续版本中实现');
    return undefined;
  };

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('错误', '请输入药品名称');
      return false;
    }
    if (!formData.dosage.trim()) {
      Alert.alert('错误', '请输入剂量');
      return false;
    }
    if (!formData.stock.trim() || parseInt(formData.stock, 10) < 0) {
      Alert.alert('错误', '请输入有效的库存数量');
      return false;
    }
    return true;
  };

  // 保存药品
  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userProfile?.familyId) {
      Alert.alert('错误', '请先创建或加入家庭组');
      return;
    }

    try {
      const medicineData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        barcode: formData.barcode.trim() || '',
        dosage: formData.dosage.trim(),
        stock: parseInt(formData.stock, 10),
        unit: formData.unit.trim(),
        contraindications: formData.contraindications,
        notes: formData.notes.trim() || '',
        expiryDate: formData.expiryDate.trim() || '',
        manufacturer: formData.manufacturer.trim() || '',
      };

      await addMedicine(
        medicineData.name,
        medicineData.description,
        medicineData.barcode,
        medicineData.dosage,
        medicineData.stock,
        medicineData.unit,
        medicineData.contraindications,
        medicineData.notes,
        medicineData.expiryDate,
        medicineData.manufacturer
      );

      Alert.alert('成功', editMode ? '药品已更新' : '药品已添加', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  // 渲染禁忌标签选择器
  const renderContraindicationSelector = () => {
    const types: { key: ContraindicationType; label: string }[] = [
      { key: 'with_water', label: CONTRAINDICATION_LABELS.with_water },
      { key: 'avoid_alcohol', label: CONTRAINDICATION_LABELS.avoid_alcohol },
      { key: 'avoid_driving', label: CONTRAINDICATION_LABELS.avoid_driving },
      { key: 'empty_stomach', label: CONTRAINDICATION_LABELS.empty_stomach },
      { key: 'after_meal', label: CONTRAINDICATION_LABELS.after_meal },
      { key: 'avoid_sunlight', label: CONTRAINDICATION_LABELS.avoid_sunlight },
      { key: 'other', label: CONTRAINDICATION_LABELS.other },
    ];

    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          用药禁忌
        </Text>
        <View style={styles.chipContainer}>
          {types.map((type) => {
            const isSelected = formData.contraindications.includes(type.key);
            return (
              <Chip
                key={type.key}
                icon={isSelected ? 'check-circle' : 'alert-circle'}
                selected={isSelected}
                onPress={() => toggleContraindication(type.key)}
                mode={isSelected ? 'flat' : 'outlined'}
                style={[styles.chip, isSelected && styles.selectedChip]}
                textStyle={styles.chipText}
              >
                {type.label}
              </Chip>
            );
          })}
        </View>
        <Text variant="bodyMedium" style={styles.hint}>
          已选择 {formData.contraindications.length} 项
        </Text>
      </View>
    );
  };

  // 渲染处方图片上传区域
  const renderPrescriptionUpload = () => {
    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          处方照片（可选）
        </Text>

        {prescriptionImage ? (
          <View style={styles.imagePreviewContainer}>
            <Avatar.Image
              size={200}
              source={{ uri: prescriptionImage.uri }}
              style={styles.imagePreview}
            />
            <View style={styles.imageActions}>
              <Button
                mode="contained-tonal"
                onPress={removePrescriptionImage}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                icon="delete"
              >
                移除照片
              </Button>
              <Button
                mode="contained-tonal"
                onPress={pickPrescriptionImage}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                icon="image"
              >
                重新选择
              </Button>
            </View>
            <Text variant="bodyMedium" style={styles.imageName}>
              {prescriptionImage.name}
            </Text>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <IconButton
              icon="camera"
              size={64}
              iconColor={theme.colors.primary}
              onPress={pickPrescriptionImage}
            />
            <Text variant="bodyLarge" style={styles.uploadHint}>
              点击上传处方照片
            </Text>
            <Text variant="bodyMedium" style={styles.uploadSubHint}>
              支持 JPG、PNG 格式，最大 5MB
            </Text>
          </View>
        )}
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
            title={editMode ? '编辑药品' : '添加药品'}
            subtitle="填写药品信息，帮助家人更好地管理用药"
            onBack={() => navigation.goBack()}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 基本信息 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              基本信息
            </Text>

            <TextInput
              label="药品名称 *"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              mode="outlined"
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="例如：布洛芬缓释胶囊"
              left={<TextInput.Icon icon="pill" />}
            />

            <TextInput
              label="药品描述"
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="例如：用于缓解头痛、关节痛"
            />

            <TextInput
              label="条形码/QR码"
              value={formData.barcode}
              onChangeText={(text) => handleChange('barcode', text)}
              mode="outlined"
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="扫描或输入药品条形码"
              left={<TextInput.Icon icon="barcode" />}
            />
          </View>

          {/* 剂量与库存 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              剂量与库存
            </Text>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <TextInput
                  label="剂量 *"
                  value={formData.dosage}
                  onChangeText={(text) => handleChange('dosage', text)}
                  mode="outlined"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  placeholder="例如：1片"
                  left={<TextInput.Icon icon="scale" />}
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="数量 *"
                  value={formData.stock}
                  onChangeText={(text) => handleChange('stock', text)}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  placeholder="例如：10"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <TextInput
                  label="单位"
                  value={formData.unit}
                  onChangeText={(text) => handleChange('unit', text)}
                  mode="outlined"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  placeholder="片"
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="有效期"
                  value={formData.expiryDate}
                  onChangeText={(text) => handleChange('expiryDate', text)}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  left={<TextInput.Icon icon="calendar" />}
                />
              </View>
            </View>

            <TextInput
              label="生产厂家"
              value={formData.manufacturer}
              onChangeText={(text) => handleChange('manufacturer', text)}
              mode="outlined"
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="例如：国药集团"
              left={<TextInput.Icon icon="factory" />}
            />
          </View>

          {/* 用药禁忌 */}
          {renderContraindicationSelector()}

          {/* 处方照片 */}
          {renderPrescriptionUpload()}

          {/* 备注 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              备注
            </Text>
            <TextInput
              label="补充说明"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              contentStyle={styles.inputContent}
              placeholder="记录其他重要信息"
            />
          </View>
        </ScrollView>

        {/* 底部操作栏 */}
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
            icon="content-save"
          >
            {editMode ? '保存修改' : '添加药品'}
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// 工具栏组件
const Toolbar: React.FC<{
  title: string;
  subtitle?: string;
  onBack: () => void;
}> = ({ title, subtitle, onBack }) => {
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
          {subtitle && (
            <Text variant="bodyMedium" style={toolbarStyles.subtitle}>
              {subtitle}
            </Text>
          )}
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
  input: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputContent: {
    fontSize: 16,
    minHeight: 56,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },

  // 禁忌标签
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: '#FAFAFA',
    borderColor: '#BDBDBD',
  },
  selectedChip: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF5252',
  },
  chipText: {
    fontSize: 16,
  },
  hint: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },

  // 图片上传
  uploadArea: {
    alignItems: 'center',
    paddingVertical: 32,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  uploadHint: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginTop: 12,
  },
  uploadSubHint: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonContent: {
    height: 48,
  },
  imageName: {
    fontSize: 14,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
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
    backgroundColor: '#FFA726',
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
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
});
