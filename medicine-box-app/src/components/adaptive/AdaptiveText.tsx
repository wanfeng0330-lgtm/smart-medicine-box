import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { useAccessibilityStore, getScaledFontSize } from '@/stores/useAccessibilityStore';

interface AdaptiveTextProps extends RNTextProps {
  variant?: 'body' | 'title' | 'subtitle' | 'caption' | 'number' | 'header';
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  color?: string;
  seniorOnly?: boolean;
}

const BASE_SIZES = {
  body: 14,
  title: 18,
  subtitle: 16,
  caption: 12,
  number: 20,
  header: 24,
};

const SENIOR_SIZES = {
  body: 22,
  title: 28,
  subtitle: 24,
  caption: 18,
  number: 32,
  header: 36,
};

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  variant = 'body',
  weight = 'regular',
  color,
  style,
  children,
  seniorOnly,
  ...props
}) => {
  const { mode, fontSizeLevel } = useAccessibilityStore();
  const isSeniorMode = mode === 'senior';
  
  if (seniorOnly && !isSeniorMode) {
    return null;
  }

  const baseSize = isSeniorMode ? SENIOR_SIZES[variant] : BASE_SIZES[variant];
  const fontSize = getScaledFontSize(baseSize);

  const fontFamily = getFontFamily(weight);

  const textColor = color || (isSeniorMode ? '#333333' : '#37474F');

  return (
    <RNText
      style={[
        {
          fontSize,
          fontFamily,
          color: textColor,
          lineHeight: fontSize * 1.4,
        },
        style,
      ]}
      maxFontSizeMultiplier={isSeniorMode ? 1.1 : 1.3}
      {...props}
    >
      {children}
    </RNText>
  );
};

const getFontFamily = (weight: string): string => {
  switch (weight) {
    case 'bold':
      return 'Nunito_ExtraBold';
    case 'semiBold':
      return 'Nunito_SemiBold';
    case 'medium':
      return 'Nunito_Medium';
    default:
      return 'Nunito_Regular';
  }
};

export const AdaptiveTitle: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="title" weight="bold" {...props} />
);

export const AdaptiveSubtitle: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="subtitle" weight="semiBold" {...props} />
);

export const AdaptiveBody: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="body" {...props} />
);

export const AdaptiveCaption: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="caption" {...props} />
);

export const AdaptiveNumber: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="number" weight="bold" {...props} />
);

export const AdaptiveHeader: React.FC<AdaptiveTextProps> = (props) => (
  <AdaptiveText variant="header" weight="bold" {...props} />
);

export default AdaptiveText;
