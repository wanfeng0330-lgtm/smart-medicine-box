import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { loginWithEmail, isLoading, error, clearError } = useCloudBaseAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleLogin = async () => {
    clearError();
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    if (!email) {
      setEmailError('请输入邮箱地址');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入正确的邮箱格式');
      isValid = false;
    }

    if (!password) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码至少6位');
      isValid = false;
    }

    if (!isValid) return;

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    await loginWithEmail(email, password);
  };

  const handleNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleDevLogin = () => {
    const devUser = {
      uid: 'dev_user_001',
      email: 'dev@test.com',
      nickname: '测试用户',
    };
    const devProfile = {
      id: devUser.uid,
      name: devUser.nickname,
      email: devUser.email,
      phone: null,
      avatar: null,
      familyId: 'dev_family_001',
      role: 'admin' as const,
      deviceId: null,
      settings: {
        quietMode: false,
        lowStockThreshold: 5,
        pushNotifications: true,
        notificationSound: 'default',
        language: 'zh-CN',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    useCloudBaseAuthStore.setState({
      user: devUser,
      userProfile: devProfile,
      isLoggedIn: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={GRADIENTS.header}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>💊</Text>
              </View>
              <Text style={styles.appName}>智能药盒</Text>
              <Text style={styles.appSlogan}>按时服药 · 健康生活</Text>
            </View>

            <View style={styles.headerDecor}>
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
              <View style={[styles.decorCircle, styles.decorCircle3]} />
            </View>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Surface style={styles.formCard} elevation={4}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>欢迎回来</Text>
              <Text style={styles.formSubtitle}>登录您的账号继续使用</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <TextInput
                label="邮箱地址"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!emailError}
                left={<TextInput.Icon icon="email" color={COLORS.primary} />}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                contentStyle={styles.inputContent}
                placeholder="请输入邮箱地址"
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            </View>

            <View style={styles.inputWrapper}>
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
                autoCapitalize="none"
                error={!!passwordError}
                left={<TextInput.Icon icon="lock" color={COLORS.primary} />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    color={COLORS.textSecondary}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                contentStyle={styles.inputContent}
                placeholder="请输入密码"
              />
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>记住我</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>忘记密码？</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                disabled={isLoading}
                labelStyle={styles.loginButtonLabel}
                buttonColor={COLORS.primary}
              >
                登 录
              </Button>
            </Animated.View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerSection}>
              <Text style={styles.registerText}>还没有账号？</Text>
              <Button
                mode="text"
                onPress={handleNavigateToRegister}
                labelStyle={styles.registerButtonLabel}
                textColor={COLORS.primary}
              >
                立即注册
              </Button>
            </View>

            <View style={styles.devSection}>
              <Button
                mode="outlined"
                onPress={handleDevLogin}
                style={styles.devButton}
                labelStyle={styles.devButtonLabel}
                textColor={COLORS.primary}
              >
                开发者登录（测试）
              </Button>
            </View>
          </Surface>
        </Animated.View>

        <View style={styles.footerSection}>
          <View style={styles.footerBadges}>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>🔒 数据加密</Text>
            </View>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>🏥 专业医疗</Text>
            </View>
          </View>
          <Text style={styles.footerText}>安全登录 · 健康守护</Text>
        </View>
      </ScrollView>

      <LoadingSpinner loading={isLoading} text="正在登录..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  headerGradient: {
    paddingTop: height * 0.06,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 44,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Nunito_ExtraBold',
  },
  appSlogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Lato_Regular',
  },
  headerDecor: {
    position: 'absolute',
    right: -30,
    top: -30,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorCircle1: {
    width: 150,
    height: 150,
    top: 0,
    right: 0,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    top: 80,
    right: 60,
  },
  decorCircle3: {
    width: 60,
    height: 60,
    top: 40,
    right: 120,
  },

  formContainer: {
    paddingHorizontal: 24,
    marginTop: -24,
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 28,
    ...SHADOWS.large,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Nunito_Bold',
  },
  formSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  errorContainer: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 15,
    flex: 1,
    fontFamily: 'Lato_Regular',
  },

  inputWrapper: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  inputContent: {
    fontSize: 16,
    fontFamily: 'Lato_Regular',
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  loginButton: {
    borderRadius: 22,
    minHeight: 58,
  },
  loginButtonContent: {
    height: 58,
  },
  loginButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
    letterSpacing: 4,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: 'Lato_Regular',
  },

  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  devSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  devButton: {
    borderColor: COLORS.primary,
    borderRadius: 18,
    width: '100%',
    minHeight: 54,
  },
  devButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  footerSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerBadges: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  footerBadge: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginHorizontal: 6,
  },
  footerBadgeText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontFamily: 'Lato_Medium',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
});
