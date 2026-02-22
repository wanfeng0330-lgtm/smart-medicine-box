import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, Platform } from 'react-native';

export type AppMode = 'normal' | 'senior';

export type FontSizeLevel = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

export interface AccessibilitySettings {
  mode: AppMode;
  fontSizeLevel: FontSizeLevel;
  highContrast: boolean;
  voiceFeedback: boolean;
  reduceMotion: boolean;
}

interface AccessibilityState extends AccessibilitySettings {
  isSeniorMode: boolean;
  fontSizeMultiplier: number;
  
  setMode: (mode: AppMode) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  setHighContrast: (enabled: boolean) => void;
  setVoiceFeedback: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  toggleMode: () => void;
  resetToDefaults: () => void;
}

const FONT_SIZE_MULTIPLIERS: Record<FontSizeLevel, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.15,
  xlarge: 1.35,
  xxlarge: 1.6,
};

const SENIOR_FONT_SIZE_LEVELS: FontSizeLevel[] = ['large', 'xlarge', 'xxlarge'];
const NORMAL_FONT_SIZE_LEVELS: FontSizeLevel[] = ['small', 'medium', 'large', 'xlarge', 'xxlarge'];

export const getAvailableFontSizes = (isSeniorMode: boolean): FontSizeLevel[] => {
  return isSeniorMode ? SENIOR_FONT_SIZE_LEVELS : NORMAL_FONT_SIZE_LEVELS;
};

export const getFontSizeLabel = (level: FontSizeLevel, isSeniorMode: boolean): string => {
  if (isSeniorMode) {
    switch (level) {
      case 'large': return '大';
      case 'xlarge': return '超大';
      case 'xxlarge': return '特大';
      default: return '大';
    }
  }
  
  switch (level) {
    case 'small': return '小';
    case 'medium': return '中';
    case 'large': return '大';
    case 'xlarge': return '超大';
    case 'xxlarge': return '特大';
    default: return '中';
  }
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      mode: 'normal',
      fontSizeLevel: 'medium',
      highContrast: false,
      voiceFeedback: true,
      reduceMotion: false,
      
      get isSeniorMode() {
        return get().mode === 'senior';
      },
      
      get fontSizeMultiplier() {
        return FONT_SIZE_MULTIPLIERS[get().fontSizeLevel];
      },

      setMode: (mode) => {
        const currentLevel = get().fontSizeLevel;
        
        let newFontLevel: FontSizeLevel;
        if (mode === 'senior') {
          newFontLevel = SENIOR_FONT_SIZE_LEVELS.includes(currentLevel) 
            ? currentLevel 
            : 'xlarge';
        } else {
          newFontLevel = NORMAL_FONT_SIZE_LEVELS.includes(currentLevel)
            ? currentLevel
            : 'medium';
        }
        
        set({ 
          mode, 
          fontSizeLevel: newFontLevel,
          highContrast: mode === 'senior' ? true : get().highContrast,
        });
        
        if (Platform.OS === 'android') {
          AccessibilityInfo.announceForAccessibility(
            mode === 'senior' ? '已切换为敬老版' : '已切换为普通版'
          );
        }
      },

      setFontSizeLevel: (level) => {
        set({ fontSizeLevel: level });
        
        if (Platform.OS === 'android') {
          const label = getFontSizeLabel(level, get().mode === 'senior');
          AccessibilityInfo.announceForAccessibility(`字体大小已调整为${label}`);
        }
      },

      setHighContrast: (enabled) => {
        set({ highContrast: enabled });
      },

      setVoiceFeedback: (enabled) => {
        set({ voiceFeedback: enabled });
      },

      setReduceMotion: (enabled) => {
        set({ reduceMotion: enabled });
      },

      toggleMode: () => {
        const newMode = get().mode === 'senior' ? 'normal' : 'senior';
        get().setMode(newMode);
      },

      resetToDefaults: () => {
        set({
          mode: 'normal',
          fontSizeLevel: 'medium',
          highContrast: false,
          voiceFeedback: true,
          reduceMotion: false,
        });
      },
    }),
    {
      name: 'accessibility-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        fontSizeLevel: state.fontSizeLevel,
        highContrast: state.highContrast,
        voiceFeedback: state.voiceFeedback,
        reduceMotion: state.reduceMotion,
      }),
    }
  )
);

export const getScaledFontSize = (baseSize: number, multiplier?: number): number => {
  const state = useAccessibilityStore.getState();
  const mult = multiplier ?? FONT_SIZE_MULTIPLIERS[state.fontSizeLevel];
  return Math.round(baseSize * mult);
};

export const getScaledDimension = (baseSize: number): number => {
  const state = useAccessibilityStore.getState();
  const multiplier = state.mode === 'senior' ? 1.2 : 1.0;
  return Math.round(baseSize * multiplier);
};

export const SENIOR_THEME = {
  colors: {
    primary: '#8B5A2B',
    primaryLight: '#D4A574',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#333333',
    textSecondary: '#555555',
    border: '#CCCCCC',
    error: '#D32F2F',
    success: '#2E7D32',
    warning: '#F57C00',
    buttonMinWidth: 120,
    buttonMinHeight: 60,
    iconMinSize: 48,
    borderRadius: 16,
  },
  fonts: {
    body: 22,
    title: 28,
    number: 32,
    caption: 18,
  },
};

export const NORMAL_THEME = {
  colors: {
    primary: '#8B5A2B',
    primaryLight: '#D4A574',
    background: '#FFF8E1',
    surface: '#FFFFFF',
    text: '#37474F',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    buttonMinWidth: 80,
    buttonMinHeight: 44,
    iconMinSize: 24,
    borderRadius: 12,
  },
  fonts: {
    body: 14,
    title: 18,
    number: 20,
    caption: 12,
  },
};

export const getTheme = (isSeniorMode: boolean) => {
  return isSeniorMode ? SENIOR_THEME : NORMAL_THEME;
};
