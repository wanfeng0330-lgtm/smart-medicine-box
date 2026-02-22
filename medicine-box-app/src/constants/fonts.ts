import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';
import * as Font from 'expo-font';

/**
 * 应用字体配置
 * Nunito: 用于标题（圆角、温暖、适合老年人阅读）
 * Lato: 用于正文（清晰、易读）
 */

export const loadFonts = async () => {
  await Font.loadAsync({
    // Nunito - 标题字体
    Nunito_Regular: Nunito_400Regular,
    Nunito_400: Nunito_400Regular,

    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_600: Nunito_600SemiBold,
    Nunito_SemiBold: Nunito_600SemiBold,

    Nunito_700Bold: Nunito_700Bold,
    Nunito_700: Nunito_700Bold,
    Nunito_Bold: Nunito_700Bold,

    Nunito_800ExtraBold: Nunito_800ExtraBold,
    Nunito_800: Nunito_800ExtraBold,
    Nunito_ExtraBold: Nunito_800ExtraBold,

    // Lato - 正文字体
    Lato_Regular: Lato_400Regular,
    Lato_400: Lato_400Regular,

    Lato_700Bold: Lato_700Bold,
    Lato_700: Lato_700Bold,
    Lato_Bold: Lato_700Bold,
  });
};

/**
 * 字体类型定义
 */
export type AppFonts = {
  // Nunito - 标题字体
  Nunito_Regular: any;
  Nunito_600SemiBold: any;
  Nunito_700Bold: any;
  Nunito_800ExtraBold: any;

  // Lato - 正文字体
  Lato_Regular: any;
  Lato_700Bold: any;
};

/**
 * 字体权重映射
 */
export const FontWeights = {
  Regular: 400,
  Medium: 700,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
};

/**
 * 获取字体系列
 */
export const getFontFamily = (weight: keyof typeof FontWeights): string => {
  switch (weight) {
    case 'ExtraBold':
      return 'Nunito_ExtraBold';
    case 'Bold':
      return 'Nunito_Bold';
    case 'SemiBold':
      return 'Nunito_SemiBold';
    case 'Medium':
      return 'Lato_Bold';
    case 'Regular':
    default:
      return 'Nunito_Regular';
  }
};
