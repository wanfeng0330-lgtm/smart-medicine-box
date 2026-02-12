import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * LoadingSpinner组件 - 适老化设计
 * 带有描述性文本的加载指示器
 *
 * @param {boolean} loading - 是否正在加载
 * @param {string} text - 加载描述文本（大字体）
 * @param {string} color - 加载指示器颜色（默认使用主题色）
 */
interface LoadingSpinnerProps {
  loading: boolean;
  text?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  text = '正在加载...',
  color,
}) => {
  const theme = useTheme();
  const indicatorColor = color || theme.colors.primary;

  if (!loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={indicatorColor} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 18, // 最小字体要求
    marginTop: 16,
    color: '#37474F',
    textAlign: 'center',
    fontWeight: '600',
  },
});
