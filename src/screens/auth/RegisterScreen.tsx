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
 * RegisterScreen - 注册界面
 * 适老化设计 - 大字体、高对比度
 */
export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { registerWithEmail, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 验证邮箱格式
  const validateEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  // 验证手机号码（中国格式）
  const validatePhone = (input: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(input);
  };

  // 验证密码强度
  const validatePassword = (input: string): boolean => {
    return input.length >= 6;
  };

  // 处理注册
  const handleRegister = async () => {
    // 清除之前的错误
    clearError();
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // 验证输入
    let isValid = true;

    if (!name) {
      setNameError('请输入姓名');
      isValid = false;
    } else if (name.length < 2) {
      setNameError('姓名至少需要2个字符');
      isValid = false;
    }

    if (!email) {
      setEmailError('请输入邮箱');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      isValid = false;
    }

    if (phone && !validatePhone(phone)) {
      setPhoneError('请输入有效的手机号码');
      isValid = false;
    }

    if (!password) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('密码至少需要6个字符');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('请确认密码');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('两次密码输入不一致');
      isValid = false;
    }

    if (!isValid) return;

    // 调用注册
    await registerWithEmail(email, password, name);
  };

  // 返回登录页面
  const handleBackToLogin = () => {
    clearError();
    navigation.goBack();
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
            创建账户
          </Text>
          <Text style={styles.subtitle}>
            填写信息完成注册
          </Text>

          {/* 全局错误提示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* 姓名输入 */}
          <TextInput
            label="姓名"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            style={styles.input}
            mode="outlined"
            autoCapitalize="words"
            error={!!nameError}
            left={<TextInput.Icon icon="account" />}
          />
          <HelperText type="error" visible={!!nameError}>
            {nameError}
          </HelperText>

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

          {/* 手机号输入（可选） */}
          <TextInput
            label="手机号（可选）"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError) setPhoneError('');
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!phoneError}
            left={<TextInput.Icon icon="phone" />}
          />
          <HelperText type="error" visible={!!phoneError}>
            {phoneError}
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

          {/* 确认密码输入 */}
          <TextInput
            label="确认密码"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError('');
            }}
            style={styles.input}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            error={!!confirmPasswordError}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          <HelperText type="error" visible={!!confirmPasswordError}>
            {confirmPasswordError}
          </HelperText>

          {/* 注册按钮 */}
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            contentStyle={styles.registerButtonContent}
            disabled={isLoading}
            labelStyle={styles.buttonLabel}
          >
            注册
          </Button>

          <Divider style={styles.divider} />

          {/* 返回登录链接 */}
          <Button
            mode="outlined"
            onPress={handleBackToLogin}
            style={styles.backButton}
            contentStyle={styles.backButtonContent}
            labelStyle={styles.buttonLabel}
          >
            已有账户？登录
          </Button>
        </View>
      </ScrollView>

      {/* 加载指示器 */}
      {isLoading && <LoadingSpinner loading={isLoading} text="正在注册..." />}
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
  registerButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  registerButtonContent: {
    height: 56, // 大按钮
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18, // 最小字体
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  backButton: {
    width: '100%',
  },
  backButtonContent: {
    height: 56,
    paddingVertical: 8,
  },
});
