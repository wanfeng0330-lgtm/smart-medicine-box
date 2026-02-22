import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';

/**
 * SuccessMessage组件 - 适老化设计
 * 显示成功消息（大字体、绿色主题）
 *
 * @param {string} message - 成功消息
 * @param {string} icon - 图标名称（默认使用'check-circle'）
 */
interface SuccessMessageProps {
  message: string;
  icon?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  icon = 'check-circle',
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.success }]} style={styles.content}>
      <Icon
        source={icon}
        size={48}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 18, // 最小字体要求
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
