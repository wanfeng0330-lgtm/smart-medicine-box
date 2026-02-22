import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Divider,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingSpinner } from '@/components/ui';

/**
 * LoginScreen - 登录界面
 * 适老化设计 - 大字体、高对比度
 */
export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { loginWithEmail, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 验证邮箱格式
  const validateEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  // 处理登录
  const handleLogin = async () => {
    // 清除之前的错误
    clearError();
    setEmailError('');
    setPasswordError('');

    // 验证输入
    let isValid = true;

    if (!email) {
      setEmailError('请输入邮箱');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      isValid = false;
    }

    if (!password) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码至少需要6个字符');
      isValid = false;
    }

    if (!isValid) return;

    // 调用登录
    await loginWithEmail(email, password);
  };

  // 跳转到注册页面
  const handleNavigateToRegister = () => {
    clearError();
    navigation.navigate('Register');
  };

  // 跳转到忘记密码页面
  const handleNavigateToForgotPassword = () => {
    clearError();
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 标题 */}
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            智能药盒
          </Text>
          <Text style={styles.subtitle}>
            登录您的账户
          </Text>

          {/* 全局错误提示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* 邮箱输入 */}
          <TextInput
            label="邮箱"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          {/* 密码输入 */}
          <TextInput
            label="密码"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            style={styles.input}
            mode="outlined"
            secureTextEntry={!showPassword}
            error={!!passwordError}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>

          {/* 忘记密码 */}
          <Button
            mode="text"
            onPress={handleNavigateToForgotPassword}
            style={styles.forgotPasswordButton}
            labelStyle={styles.forgotPasswordLabel}
          >
            忘记密码？
          </Button>

          {/* 登录按钮 */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            disabled={isLoading}
            labelStyle={styles.buttonLabel}
          >
            登录
          </Button>

          <Divider style={styles.divider} />

          {/* 注册链接 */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              还没有账户？
            </Text>
            <Button
              mode="outlined"
              onPress={handleNavigateToRegister}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              labelStyle={styles.buttonLabel}
            >
              注册
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* 加载指示器 */}
      {isLoading && <LoadingSpinner loading={isLoading} text="正在登录..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48, // 大标题
    fontWeight: '800',
    color: '#FFA726',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B71C1C',
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    minHeight: 56, // 大输入框
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordLabel: {
    fontSize: 18, // 最小字体
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 16,
  },
  loginButtonContent: {
    height: 56, // 大按钮
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18, // 最小字体
    fontWeight: '600',
  },
  divider: {
    marginVertical: 24,
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 18,
    color: '#37474F',
    marginBottom: 12,
  },
  registerButton: {
    width: '100%',
  },
  registerButtonContent: {
    height: 56,
    paddingVertical: 8,
  },
});
