import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { Text, Button as PaperButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAccessibilityStore, getScaledFontSize, getScaledDimension } from '@/stores/useAccessibilityStore';

interface AdaptiveButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  voiceFeedback?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AdaptiveButton: React.FC<AdaptiveButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  voiceFeedback,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { mode, fontSizeLevel, voiceFeedback: globalVoiceFeedback } = useAccessibilityStore();
  const isSeniorMode = mode === 'senior';

  const handlePress = () => {
    if (disabled) return;
    
    if (voiceFeedback && globalVoiceFeedback && isSeniorMode) {
      const { AccessibilityInfo, Platform } = require('react-native');
      if (Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(voiceFeedback);
      }
    }
    
    onPress();
  };

  const buttonStyle = getButtonStyle(variant, size, isSeniorMode, disabled);
  const textColor = getTextColor(variant, isSeniorMode, disabled);
  const fontSize = getScaledFontSize(getBaseFontSize(size, isSeniorMode));

  const minWidth = isSeniorMode ? getScaledDimension(120) : getScaledDimension(80);
  const minHeight = isSeniorMode ? getScaledDimension(60) : getScaledDimension(44);
  const borderRadius = isSeniorMode ? 16 : 12;

  if (variant === 'primary' && !disabled) {
    const colors = isSeniorMode 
      ? ['#8B5A2B', '#6B4423'] as const
      : ['#8B5A2B', '#A0522D'] as const;

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[
          { minWidth, minHeight },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientButton,
            { 
              minHeight,
              borderRadius,
              paddingHorizontal: isSeniorMode ? 24 : 16,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize, color: '#FFFFFF' },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        buttonStyle,
        {
          minWidth,
          minHeight,
          borderRadius,
          paddingHorizontal: isSeniorMode ? 24 : 16,
        },
        fullWidth && { width: '100%' },
        disabled && styles.disabledButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { fontSize, color: textColor },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const getBaseFontSize = (size: string, isSeniorMode: boolean): number => {
  if (isSeniorMode) {
    switch (size) {
      case 'small': return 18;
      case 'large': return 24;
      default: return 20;
    }
  }
  
  switch (size) {
    case 'small': return 14;
    case 'large': return 18;
    default: return 16;
  }
};

const getButtonStyle = (
  variant: string,
  size: string,
  isSeniorMode: boolean,
  disabled: boolean
): ViewStyle => {
  const baseStyle: ViewStyle = {
    borderWidth: 2,
  };

  if (disabled) {
    return {
      ...baseStyle,
      backgroundColor: isSeniorMode ? '#EEEEEE' : '#F5F5F5',
      borderColor: isSeniorMode ? '#CCCCCC' : '#E0E0E0',
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: isSeniorMode ? '#FFF8E1' : '#FFFFFF',
        borderColor: isSeniorMode ? '#8B5A2B' : '#BDBDBD',
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderColor: isSeniorMode ? '#8B5A2B' : '#8B5A2B',
      };
    case 'danger':
      return {
        ...baseStyle,
        backgroundColor: isSeniorMode ? '#FFEBEE' : '#FFEBEE',
        borderColor: isSeniorMode ? '#D32F2F' : '#EF5350',
      };
    case 'success':
      return {
        ...baseStyle,
        backgroundColor: isSeniorMode ? '#E8F5E9' : '#E8F5E9',
        borderColor: isSeniorMode ? '#2E7D32' : '#66BB6A',
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: isSeniorMode ? '#8B5A2B' : '#8B5A2B',
        borderColor: isSeniorMode ? '#6B4423' : '#6B4423',
      };
  }
};

const getTextColor = (
  variant: string,
  isSeniorMode: boolean,
  disabled: boolean
): string => {
  if (disabled) {
    return isSeniorMode ? '#999999' : '#BDBDBD';
  }

  const primaryText = isSeniorMode ? '#333333' : '#37474F';

  switch (variant) {
    case 'primary':
      return '#FFFFFF';
    case 'secondary':
    case 'outline':
      return isSeniorMode ? '#8B5A2B' : '#8B5A2B';
    case 'danger':
      return isSeniorMode ? '#D32F2F' : '#EF5350';
    case 'success':
      return isSeniorMode ? '#2E7D32' : '#66BB6A';
    default:
      return primaryText;
  }
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  gradientButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AdaptiveButton;
