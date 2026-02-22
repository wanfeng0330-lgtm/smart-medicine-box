import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D6E',
    primaryContainer: '#E8F5F3',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0D3D35',

    secondary: '#4ECDC4',
    secondaryContainer: '#E5F9F7',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1A4A47',

    tertiary: '#FF6B6B',
    tertiaryContainer: '#FFE5E5',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#4A1A1A',

    background: '#F7F3EB',
    onBackground: '#2D3436',

    surface: '#FFFFFF',
    surfaceVariant: '#F7F3EB',
    onSurface: '#2D3436',
    onSurfaceVariant: '#636E72',

    error: '#FF6B6B',
    errorContainer: '#FFE5E5',
    onError: '#FFFFFF',
    onErrorContainer: '#4A1A1A',

    warning: '#F5A623',
    success: '#5CB85C',

    outline: '#BDC3C7',
    outlineVariant: '#ECF0F1',

    elevation: {
      level0: 'transparent',
      level1: 'rgba(46, 125, 110, 0.05)',
      level2: 'rgba(46, 125, 110, 0.08)',
      level3: 'rgba(46, 125, 110, 0.12)',
      level4: 'rgba(46, 125, 110, 0.15)',
      level5: 'rgba(46, 125, 110, 0.18)',
    },
  },

  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      fontFamily: 'Nunito_ExtraBold',
      fontSize: 36,
      lineHeight: 48,
      letterSpacing: 0,
    },
    displayMedium: {
      fontFamily: 'Nunito_Bold',
      fontSize: 32,
      lineHeight: 44,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 28,
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineLarge: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 24,
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: 'Nunito_SemiBold',
      fontSize: 22,
      lineHeight: 32,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: 'Nunito_Medium',
      fontSize: 20,
      lineHeight: 30,
      letterSpacing: 0,
    },
    titleLarge: {
      fontFamily: 'Nunito_Medium',
      fontSize: 20,
      lineHeight: 32,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'Nunito_Medium',
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleSmall: {
      fontFamily: 'Nunito_Medium',
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: 0,
    },
    bodyLarge: {
      fontFamily: 'Lato_Regular',
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontFamily: 'Lato_Regular',
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: 'Lato_Regular',
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    labelLarge: {
      fontFamily: 'Lato_Medium',
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
    },
    labelMedium: {
      fontFamily: 'Lato_Medium',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontFamily: 'Lato_Medium',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.5,
    },
  },

  roundness: 20,
};

export const COLORS = {
  primary: '#2E7D6E',
  primaryLight: '#4ECDC4',
  primaryDark: '#1A4A47',
  
  secondary: '#4ECDC4',
  secondaryLight: '#7EDDD6',
  secondaryDark: '#2E7D6E',
  
  accent: '#FF6B6B',
  accentLight: '#FF9999',
  accentDark: '#CC5555',
  
  background: '#F7F3EB',
  backgroundLight: '#FFFFFF',
  backgroundDark: '#E8E4DC',
  
  surface: '#FFFFFF',
  surfaceVariant: '#F7F3EB',
  
  success: '#5CB85C',
  successLight: '#7ED37E',
  successDark: '#4A9A4A',
  
  warning: '#F5A623',
  warningLight: '#FFC266',
  warningDark: '#CC8A1C',
  
  error: '#FF6B6B',
  errorLight: '#FF9999',
  errorDark: '#CC5555',
  
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#BDC3C7',
  
  border: '#E8E4DC',
  borderDark: '#D4D0C8',
};

export const GRADIENTS = {
  primary: ['#2E7D6E', '#4ECDC4'] as const,
  header: ['#2E7D6E', '#3A9D8F'] as const,
  card: ['#FFFFFF', '#F7F3EB'] as const,
  success: ['#5CB85C', '#7ED37E'] as const,
  warning: ['#F5A623', '#FFC266'] as const,
  accent: ['#FF6B6B', '#FF9999'] as const,
};

export const SHADOWS = {
  small: {
    shadowColor: '#2E7D6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#2E7D6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#2E7D6E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default theme;
