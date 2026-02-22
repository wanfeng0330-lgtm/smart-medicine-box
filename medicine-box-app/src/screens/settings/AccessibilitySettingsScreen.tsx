import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Divider,
  Portal,
  Dialog,
  Button as PaperButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAccessibilityStore, getAvailableFontSizes, getFontSizeLabel, FontSizeLevel } from '@/stores/useAccessibilityStore';
import { AdaptiveText, AdaptiveButton } from '@/components/adaptive';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

export const AccessibilitySettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    mode,
    fontSizeLevel,
    highContrast,
    voiceFeedback,
    reduceMotion,
    setMode,
    setFontSizeLevel,
    setHighContrast,
    setVoiceFeedback,
    setReduceMotion,
    resetToDefaults,
  } = useAccessibilityStore();

  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [showFontSlider, setShowFontSlider] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isSeniorMode = mode === 'senior';
  const availableFontSizes = getAvailableFontSizes(isSeniorMode);

  const handleToggleMode = () => {
    const newMode = isSeniorMode ? 'normal' : 'senior';
    setShowModeConfirm(true);
  };

  const confirmModeChange = () => {
    const newMode = isSeniorMode ? 'normal' : 'senior';
    setMode(newMode);
    setShowModeConfirm(false);
  };

  const handleFontSizeChange = (level: FontSizeLevel) => {
    setFontSizeLevel(level);
    setShowFontSlider(false);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
    Alert.alert('成功', '已恢复默认设置');
  };

  const renderModeToggle = () => (
    <Card style={[styles.settingCard, isSeniorMode && styles.seniorCard]} elevation={2}>
      <Card.Content>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <IconButton
              icon={isSeniorMode ? 'account-heart' : 'account'}
              size={isSeniorMode ? 48 : 32}
              iconColor={isSeniorMode ? COLORS.primary : COLORS.textSecondary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <AdaptiveText variant="subtitle" weight="semiBold">
                {isSeniorMode ? '敬老版' : '普通版'}
              </AdaptiveText>
              <AdaptiveText variant="caption" color={isSeniorMode ? '#555555' : COLORS.textSecondary}>
                {isSeniorMode ? '大字体、简化界面' : '标准字体、完整功能'}
              </AdaptiveText>
            </View>
          </View>
          <PaperButton
            mode="contained"
            onPress={handleToggleMode}
            buttonColor={isSeniorMode ? '#8B5A2B' : COLORS.primary}
            style={styles.modeButton}
            labelStyle={{ fontSize: isSeniorMode ? 18 : 14 }}
          >
            切换为{isSeniorMode ? '普通版' : '敬老版'}
          </PaperButton>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFontSizeSetting = () => (
    <Card style={[styles.settingCard, isSeniorMode && styles.seniorCard]} elevation={2}>
      <Card.Content>
        <View style={styles.settingHeader}>
          <IconButton
            icon="format-size"
            size={isSeniorMode ? 48 : 32}
            iconColor={COLORS.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <AdaptiveText variant="subtitle" weight="semiBold">
              字体大小
            </AdaptiveText>
            <AdaptiveText variant="caption" color={isSeniorMode ? '#555555' : COLORS.textSecondary}>
              当前: {getFontSizeLabel(fontSizeLevel, isSeniorMode)}
            </AdaptiveText>
          </View>
        </View>

        <View style={styles.fontSizeOptions}>
          {availableFontSizes.map((level) => (
            <PaperButton
              key={level}
              mode={fontSizeLevel === level ? 'contained' : 'outlined'}
              onPress={() => handleFontSizeChange(level)}
              style={[
                styles.fontSizeButton,
                fontSizeLevel === level && styles.fontSizeButtonActive,
              ]}
              labelStyle={{
                fontSize: isSeniorMode ? 20 : 16,
                color: fontSizeLevel === level ? '#FFFFFF' : COLORS.primary,
              }}
              buttonColor={fontSizeLevel === level ? COLORS.primary : undefined}
            >
              {getFontSizeLabel(level, isSeniorMode)}
            </PaperButton>
          ))}
        </View>

        <View style={styles.previewBox}>
          <AdaptiveText variant="body" style={styles.previewText}>
            预览文字效果
          </AdaptiveText>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOtherSettings = () => (
    <Card style={[styles.settingCard, isSeniorMode && styles.seniorCard]} elevation={2}>
      <Card.Content>
        <AdaptiveText variant="subtitle" weight="semiBold" style={styles.sectionTitle}>
          其他设置
        </AdaptiveText>

        <View style={styles.switchRow}>
          <AdaptiveText variant="body">高对比度模式</AdaptiveText>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: '#E0E0E0', true: COLORS.primary + '60' }}
            thumbColor={highContrast ? COLORS.primary : '#F5F5F5'}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.switchRow}>
          <AdaptiveText variant="body">语音反馈</AdaptiveText>
          <Switch
            value={voiceFeedback}
            onValueChange={setVoiceFeedback}
            trackColor={{ false: '#E0E0E0', true: COLORS.primary + '60' }}
            thumbColor={voiceFeedback ? COLORS.primary : '#F5F5F5'}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.switchRow}>
          <AdaptiveText variant="body">减少动画</AdaptiveText>
          <Switch
            value={reduceMotion}
            onValueChange={setReduceMotion}
            trackColor={{ false: '#E0E0E0', true: COLORS.primary + '60' }}
            thumbColor={reduceMotion ? COLORS.primary : '#F5F5F5'}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderResetButton = () => (
    <View style={styles.resetSection}>
      <PaperButton
        mode="outlined"
        onPress={handleReset}
        style={styles.resetButton}
        textColor={COLORS.error}
        icon="refresh"
        labelStyle={{ fontSize: isSeniorMode ? 18 : 16 }}
      >
        恢复默认设置
      </PaperButton>
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
          <IconButton
            icon="arrow-left"
            size={isSeniorMode ? 40 : 28}
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
          <AdaptiveText variant="title" weight="bold" color="#FFFFFF">
            模式设置
          </AdaptiveText>
          <View style={{ width: isSeniorMode ? 40 : 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderModeToggle()}
        {renderFontSizeSetting()}
        {renderOtherSettings()}
        {renderResetButton()}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showModeConfirm}
          onDismiss={() => setShowModeConfirm(false)}
          style={styles.dialog}
        >
          <Dialog.Title>确认切换模式</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              确定要切换为{isSeniorMode ? '普通版' : '敬老版'}吗？
            </Text>
            {!isSeniorMode && (
              <Text style={styles.dialogHint}>
                敬老版将使用大字体和简化的界面设计
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setShowModeConfirm(false)}>取消</PaperButton>
            <PaperButton onPress={confirmModeChange} textColor={COLORS.primary}>
              确认
            </PaperButton>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showResetConfirm}
          onDismiss={() => setShowResetConfirm(false)}
          style={styles.dialog}
        >
          <Dialog.Title>确认重置</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              确定要恢复默认设置吗？所有个性化设置将被清除。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setShowResetConfirm(false)}>取消</PaperButton>
            <PaperButton onPress={confirmReset} textColor={COLORS.error}>
              重置
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  settingCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  seniorCard: {
    borderWidth: 2,
    borderColor: '#8B5A2B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  settingTextContainer: {
    flex: 1,
  },
  modeButton: {
    borderRadius: 16,
    minWidth: 120,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  fontSizeButton: {
    borderRadius: 16,
    minWidth: 80,
    flex: 1,
  },
  fontSizeButtonActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewText: {
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  resetSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  resetButton: {
    borderRadius: 16,
    borderColor: COLORS.error,
    minWidth: 200,
  },
  dialog: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  dialogText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  dialogHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

export default AccessibilitySettingsScreen;
