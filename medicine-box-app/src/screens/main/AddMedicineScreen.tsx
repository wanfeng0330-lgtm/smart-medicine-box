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
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { ContraindicationType } from '@/types/medicine';
import { LoadingSpinner } from '@/components/ui';

const CONTRAINDICATION_LABELS: Record<ContraindicationType, string> = {
  with_water: '用药时需用温水送服',
  avoid_alcohol: '服药期间禁止饮酒',
  avoid_driving: '服药后请勿驾驶',
  empty_stomach: '请空腹服用',
  after_meal: '请饭后服用',
  avoid_sunlight: '服药后避免阳光直射',
  other: '其他注意事项',
};

export const AddMedicineScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { userProfile } = useCloudBaseAuthStore();
  const { addMedicine, isLoading, error, clearError } = useCloudBaseMedicineStore();
  const editMode = !!route?.params?.medicine;

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

  const [prescriptionImage, setPrescriptionImage] = useState<{ uri: string; name: string } | null>(null);

  React.useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleContraindication = (type: ContraindicationType) => {
    setFormData((prev) => {
      const isSelected = prev.contraindications.includes(type);
      const newContraindications = isSelected
        ? prev.contraindications.filter((t: ContraindicationType) => t !== type)
        : [...prev.contraindications, type];
      return { ...prev, contraindications: newContraindications };
    });
  };

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
        setPrescriptionImage({ uri: asset.uri, name: asset.fileName || 'prescription.jpg' });
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const removePrescriptionImage = () => setPrescriptionImage(null);

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

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userProfile?.familyId) {
      Alert.alert('错误', '请先创建或加入家庭组');
      return;
    }

    try {
      await addMedicine(
        formData.name.trim(),
        formData.dosage.trim(),
        parseInt(formData.stock, 10),
        formData.description.trim() || undefined,
        formData.barcode.trim() || undefined,
        formData.unit.trim(),
        formData.contraindications,
        formData.notes.trim() || undefined,
        formData.expiryDate.trim() || undefined,
        formData.manufacturer.trim() || undefined
      );

      Alert.alert('成功', editMode ? '药品已更新' : '药品已添加', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const renderContraindicationSelector = () => {
    const types: { key: ContraindicationType; label: string }[] = [
      { key: 'with_water', label: '温水送服' },
      { key: 'avoid_alcohol', label: '禁酒' },
      { key: 'avoid_driving', label: '禁驾' },
      { key: 'empty_stomach', label: '空腹' },
      { key: 'after_meal', label: '饭后' },
      { key: 'avoid_sunlight', label: '避光' },
    ];

    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>用药注意事项</Text>
        <View style={styles.chipContainer}>
          {types.map((type) => {
            const isSelected = formData.contraindications.includes(type.key);
            return (
              <Chip
                key={type.key}
                selected={isSelected}
                onPress={() => toggleContraindication(type.key)}
                mode={isSelected ? 'flat' : 'outlined'}
                style={[styles.chip, isSelected && { backgroundColor: '#FFA726' }]}
                textStyle={{ color: isSelected ? '#FFFFFF' : '#757575', fontSize: 16 }}
              >
                {type.label}
              </Chip>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPrescriptionUpload = () => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>处方照片（可选）</Text>
      {prescriptionImage ? (
        <View style={styles.imagePreviewContainer}>
          <Avatar.Image size={150} source={{ uri: prescriptionImage.uri }} style={styles.imagePreview} />
          <View style={styles.imageActions}>
            <Button mode="outlined" onPress={removePrescriptionImage} textColor="#EF5350">移除</Button>
            <Button mode="outlined" onPress={pickPrescriptionImage} textColor="#FFA726">更换</Button>
          </View>
        </View>
      ) : (
        <Button
          mode="outlined"
          onPress={pickPrescriptionImage}
          style={styles.uploadButton}
          labelStyle={{ fontSize: 16 }}
          textColor="#FFA726"
          icon="camera"
        >
          点击上传处方照片
        </Button>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton icon="arrow-left" size={32} iconColor="#FFFFFF" onPress={() => navigation.goBack()} />
            <View>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                {editMode ? '编辑药品' : '添加药品'}
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                填写药品信息
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>基本信息</Text>

            <TextInput
              label="药品名称 *"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              mode="outlined"
              style={styles.input}
              placeholder="例如：布洛芬缓释胶囊"
              left={<TextInput.Icon icon="pill" color="#FFA726" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#FFA726"
            />

            <TextInput
              label="药品描述"
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              placeholder="用于缓解头痛、关节痛"
              outlineColor="#E0E0E0"
              activeOutlineColor="#FFA726"
            />

            <TextInput
              label="条形码"
              value={formData.barcode}
              onChangeText={(text) => handleChange('barcode', text)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="barcode" color="#FFA726" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#FFA726"
            />
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>剂量与库存</Text>

            <View style={styles.rowInputs}>
              <TextInput
                label="剂量 *"
                value={formData.dosage}
                onChangeText={(text) => handleChange('dosage', text)}
                mode="outlined"
                style={styles.halfInput}
                placeholder="1片"
                left={<TextInput.Icon icon="scale" color="#FFA726" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FFA726"
              />
              <TextInput
                label="库存 *"
                value={formData.stock}
                onChangeText={(text) => handleChange('stock', text)}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.halfInput}
                placeholder="10"
                outlineColor="#E0E0E0"
                activeOutlineColor="#FFA726"
              />
            </View>

            <View style={styles.rowInputs}>
              <TextInput
                label="单位"
                value={formData.unit}
                onChangeText={(text) => handleChange('unit', text)}
                mode="outlined"
                style={styles.halfInput}
                placeholder="片"
                outlineColor="#E0E0E0"
                activeOutlineColor="#FFA726"
              />
              <TextInput
                label="有效期"
                value={formData.expiryDate}
                onChangeText={(text) => handleChange('expiryDate', text)}
                mode="outlined"
                style={styles.halfInput}
                placeholder="YYYY-MM-DD"
                left={<TextInput.Icon icon="calendar" color="#FFA726" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#FFA726"
              />
            </View>

            <TextInput
              label="生产厂家"
              value={formData.manufacturer}
              onChangeText={(text) => handleChange('manufacturer', text)}
              mode="outlined"
              style={styles.input}
              placeholder="国药集团"
              left={<TextInput.Icon icon="factory" color="#FFA726" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#FFA726"
            />
          </View>

          {renderContraindicationSelector()}
          {renderPrescriptionUpload()}

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>备注</Text>
            <TextInput
              label="补充说明"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="其他重要信息"
              outlineColor="#E0E0E0"
              activeOutlineColor="#FFA726"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            disabled={isLoading}
            textColor="#757575"
          >
            取消
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
            loading={isLoading}
            disabled={isLoading}
            buttonColor="#FFA726"
          >
            {editMode ? '保存修改' : '添加药品'}
          </Button>
        </View>
      </SafeAreaView>

      <LoadingSpinner loading={isLoading} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E1' },
  header: { backgroundColor: '#FFA726', paddingTop: 12, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#37474F', marginBottom: 16 },
  input: { marginBottom: 12, backgroundColor: '#FAFAFA' },
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1, backgroundColor: '#FAFAFA' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderRadius: 8 },
  uploadButton: { borderRadius: 12, borderStyle: 'dashed' },
  imagePreviewContainer: { alignItems: 'center' },
  imagePreview: { backgroundColor: '#F5F5F5' },
  imageActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  cancelButton: { flex: 1, borderRadius: 12, borderColor: '#BDBDBD' },
  saveButton: { flex: 1, borderRadius: 12 },
  buttonContent: { height: 56 },
});
