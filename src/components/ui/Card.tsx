import React, { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Card组件 - 适老化设计
 * 带有elevating阴影的卡片组件，支持点击事件
 *
 * @param {ReactNode} children - 子组件
 * @param {() => void} onPress - 点击回调（可选）
 * @param {boolean} activeOpacity - 点击透明度（默认0.7）
 * @param {ViewStyle} style - 自定义样式
 * @param {boolean} elevated - 是否提升阴影（默认true）
 * @param {number} elevation - 阴影等级（默认2）
 */
interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  activeOpacity?: number;
  style?: ViewStyle;
  elevated?: boolean;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  activeOpacity = 0.7,
  style,
  elevated = true,
  elevation = 2,
}) => {
  const theme = useTheme();

  const shadowSettings = elevated ? {
    ...StyleSheet.shadowStyleProp(elevation),
    shadowColor: theme.colors.shadow,
    backgroundColor: theme.colors.surface,
  } : {};

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? activeOpacity : 1}
      style={[
        styles.card,
        shadowSettings,
        theme.roundness >= 0 && {
          borderRadius: theme.roundness,
        },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
