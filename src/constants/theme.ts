import { MD3LightTheme } from 'react-native-paper';

// 智能药盒APP主题 - 适老化设计
// 遵循软粉彩风格（Soft/pastel）

const theme = {
  ...MD3LightTheme,
  // 主色调 - 温暖的琥珀色
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FFA726',          // 柔和琥珀色
    primaryContainer: '#FFE0B2', // 浅琥珀色容器
    onPrimary: '#FFFFFF',        // 主色上的文字
    onPrimaryContainer: '#4D2000', // 主色容器上的文字

    // 辅助色1 - 清新淡蓝色
    secondary: '#29B6F6',
    secondaryContainer: '#E1F5FE',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#001D3D',

    // 辅助色2 - 健康薄荷绿
    tertiary: '#66BB6A',
    tertiaryContainer: '#C8E6C9',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1B5E20',

    // 背景色 - 保护眼睛的浅灰
    background: '#FAFAFA',
    onBackground: '#37474F',

    // 表面颜色
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onSurface: '#37474F',
    onSurfaceVariant: '#546E7A',

    // 错误、警告、成功
    error: '#EF5350',
    errorContainer: '#FFEBEE',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',

    warning: '#FF9800',
    success: '#4CAF50',

    // 边框和分割线
    outline: '#BDBDBD',
    outlineVariant: '#E0E0E0',

    // 阴影
    shadow: '#000000',
    elevation: {
      level0: 'transparent',
      level1: 'rgba(0, 0, 0, 0.08)',
      level2: 'rgba(0, 0, 0, 0.12)',
      level3: 'rgba(0, 0, 0, 0.14)',
      level4: 'rgba(0, 0, 0, 0.16)',
      level5: 'rgba(0, 0, 0, 0.18)',
    },
  },

  // 适老化字体设置 - 最小18pt
  fonts: {
    ...MD3LightTheme.fonts,
    // 标题字体 - Nunito（圆角温暖）
    displayLarge: {
      fontFamily: 'Nunito_ExtraBold',
      fontSize: 36, // 约48pt
      lineHeight: 48,
      letterSpacing: 0,
    },
    displayMedium: {
      fontFamily: 'Nunito_Bold',
      fontSize: 32, // 约42pt
      lineHeight: 44,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 28, // 约37pt
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineLarge: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 24, // 约32pt
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 22, // 约29pt
      lineHeight: 32,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: 'Nunito_Medium',
      fontSize: 20, // 约27pt
      lineHeight: 30,
      letterSpacing: 0,
    },
    titleLarge: {
      fontFamily: 'Nunito_Medium',
      fontSize: 20, // 约27pt
      lineHeight: 32,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'Nunito_Medium',
      fontSize: 18, // 约24pt - 最小推荐
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleSmall: {
      fontFamily: 'Nunito_Medium',
      fontSize: 18, // 约24pt - 最小
      lineHeight: 26,
      letterSpacing: 0,
    },

    // 正文字体 - Lato（清晰易读）
    bodyLarge: {
      fontFamily: 'Lato_Regular',
      fontSize: 18, // 约24pt - 最小
      lineHeight: 28,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontFamily: 'Lato_Regular',
      fontSize: 18, // 约24pt - 最小
      lineHeight: 26,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: 'Lato_Regular',
      fontSize: 18, // 约24pt - 最小
      lineHeight: 24,
      letterSpacing: 0,
    },

    // 标签字体
    labelLarge: {
      fontFamily: 'Lato_Medium',
      fontSize: 18, // 约24pt
      lineHeight: 24,
      letterSpacing: 0,
    },
    labelMedium: {
      fontFamily: 'Lato_Medium',
      fontSize: 18, // 约24pt
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontFamily: 'Lato_Medium',
      fontSize: 18, // 约24pt
      lineHeight: 20,
      letterSpacing: 0.5,
    },
  },

  // 圆角 - 适当的圆角让界面更友好
  roundness: 12,

  // 适老化组件设置
  components: {
    ...MD3LightTheme.components,
    Button: {
      ...MD3LightTheme.components.Button,
      // 大按钮 - 最小48x48 dp
      styles: {
        ...MD3LightTheme.components.Button.styles,
        large: {
          containerStyle: {
            height: 56, // 更大的高度
            borderRadius: 12,
          },
          labelStyle: {
            fontSize: 18, // 最小字体
            fontWeight: '600',
          },
        },
        medium: {
          containerStyle: {
            height: 48, // 最小触摸目标
            borderRadius: 12,
          },
          labelStyle: {
            fontSize: 18, // 最小字体
            fontWeight: '600',
          },
        },
      },
    },
    TextInput: {
      ...MD3LightTheme.components.TextInput,
      styles: {
        ...MD3LightTheme.components.TextInput.styles,
        dense: {
          minHeight: 56, // 更大的输入框
          fontSize: 18,  // 最小字体
        },
        outlined: {
          minHeight: 56,
          fontSize: 18,
          borderRadius: 8,
        },
      },
    },
    Card: {
      ...MD3LightTheme.components.Card,
      styles: {
        ...MD3LightTheme.components.Card.styles,
        elevation: 2,
        borderRadius: 12,
      },
    },
    FAB: {
      ...MD3LightTheme.components.FAB,
      // 悬浮按钮 - 更大的尺寸
      size: {
        small: 48,
        medium: 56,
        large: 64,
      },
    },
    IconButton: {
      ...MD3LightTheme.components.IconButton,
      // 图标按钮 - 最小48x48
      size: 48,
    },
    Checkbox: {
      ...MD3LightTheme.components.Checkbox,
      // 复选框 - 更大的触摸目标
      size: 28,
    },
    RadioButton: {
      ...MD3LightTheme.components.RadioButton,
      // 单选按钮 - 更大的触摸目标
      size: 28,
    },
    Switch: {
      ...MD3LightTheme.components.Switch,
      // 开关 - 更大的尺寸
      thumbHeight: 28,
      thumbWidth: 28,
      trackHeight: 36,
    },
  },
};

export default theme;
