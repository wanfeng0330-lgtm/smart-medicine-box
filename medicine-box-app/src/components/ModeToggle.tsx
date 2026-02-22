import React from 'react';
import { View, StyleSheet, TouchableOpacity, AccessibilityInfo, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useAccessibilityStore } from '@/stores/useAccessibilityStore';
import { COLORS } from '@/constants/theme';

interface ModeToggleProps {
  compact?: boolean;
  showLabel?: boolean;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ 
  compact = false, 
  showLabel = true 
}) => {
  const { mode, toggleMode } = useAccessibilityStore();
  const isSeniorMode = mode === 'senior';

  const handleToggle = () => {
    if (Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(
        isSeniorMode ? '正在切换为普通版' : '正在切换为敬老版'
      );
    }
    toggleMode();
  };

  const iconSize = isSeniorMode ? 32 : 24;
  const fontSize = isSeniorMode ? 18 : 14;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handleToggle}
        style={[
          styles.compactButton,
          isSeniorMode && styles.seniorCompactButton,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isSeniorMode ? '切换为普通版' : '切换为敬老版'}
        accessibilityHint="点击切换显示模式"
      >
        <IconButton
          icon={isSeniorMode ? 'account-heart' : 'account-cog'}
          size={iconSize}
          iconColor={isSeniorMode ? '#8B5A2B' : '#FFFFFF'}
          style={styles.iconButton}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[
        styles.container,
        isSeniorMode && styles.seniorContainer,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSeniorMode ? '切换为普通版' : '切换为敬老版'}
      accessibilityHint="点击切换显示模式"
    >
      <IconButton
        icon={isSeniorMode ? 'account-heart' : 'account-cog'}
        size={iconSize}
        iconColor={isSeniorMode ? '#8B5A2B' : '#FFFFFF'}
        style={styles.iconButton}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize },
            isSeniorMode && styles.seniorLabel,
          ]}
        >
          {isSeniorMode ? '普通版' : '敬老版'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seniorContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  seniorCompactButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 24,
    padding: 6,
  },
  iconButton: {
    margin: 0,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 4,
  },
  seniorLabel: {
    color: '#8B5A2B',
    fontWeight: '700',
  },
});

export default ModeToggle;
