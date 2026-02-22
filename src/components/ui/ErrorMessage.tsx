import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';

/**
 * ErrorMessage组件 - 适老化设计
 * 显示错误消息（大字体、高对比度）并提供重试按钮
 *
 * @param {string} message - 错误消息
 * @param {() => void} onRetry - 重试回调函数
 * @param {string} icon - 图标名称（默认使用'alert-circle'）
 */
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  icon?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  icon = 'alert-circle',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon
          source={icon}
          size={48}
          color={theme.colors.error}
          style={styles.icon}
        />
        <Text style={styles.title}>出错了</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
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
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24, // 更大字体强调
    fontWeight: '700',
    color: '#EF5350',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18, // 最小字体要求
    color: '#37474F',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 18, // 最小字体要求
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
