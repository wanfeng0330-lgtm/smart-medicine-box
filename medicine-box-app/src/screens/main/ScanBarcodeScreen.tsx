import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ScanBarcodeScreen - 扫描条形码界面（占位符）
 * TODO: 集成 expo-barcode-scanner 实现条形码扫描
 */
export const ScanBarcodeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text variant="headlineLarge" style={styles.title}>
            条形码扫描
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            此功能需要集成 expo-barcode-scanner
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            返回
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    alignItems: 'center',
    padding: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFA726',
  },
  buttonContent: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    height: 56,
  },
});
