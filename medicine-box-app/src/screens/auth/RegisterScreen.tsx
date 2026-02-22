import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
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

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { registerWithEmail, checkPasswordStrength, isLoading, error, clearError } = useCloudBaseAuthStore();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      setPasswordStrength(checkPasswordStrength(text));
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
    if (passwordError) setPasswordError('');
  };

  const handleRegister = async () => {
    clearError();
    setEmailError('');
    setNicknameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;

    if (!email) {
      setEmailError('请输入邮箱地址');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入正确的邮箱格式');
      isValid = false;
    }

    if (!nickname) {
      setNicknameError('请输入昵称');
      isValid = false;
    } else if (nickname.length < 2) {
      setNicknameError('昵称至少2个字符');
      isValid = false;
    }

    if (!password) {
      setPasswordError('请设置密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码至少6位');
      isValid = false;
    } else if (passwordStrength.score <= 2) {
      setPasswordError('密码强度不足，请设置更复杂的密码');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('请确认密码');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('两次密码不一致');
      isValid = false;
    }

    if (!agreedToTerms) {
      isValid = false;
    }

    if (!isValid) return;

    await registerWithEmail(email, password, nickname);
  };

  const handleBackToLogin = () => {
    clearError();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.appName}>创建账号</Text>
              <Text style={styles.appSlogan}>开启健康服药之旅</Text>
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
                label="昵称"
                value={nickname}
                onChangeText={(text) => {
                  setNickname(text);
                  if (nicknameError) setNicknameError('');
                }}
                style={styles.input}
                mode="outlined"
                error={!!nicknameError}
                left={<TextInput.Icon icon="account" color={COLORS.primary} />}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                contentStyle={styles.inputContent}
                placeholder="请输入您的昵称"
              />
              <HelperText type="error" visible={!!nicknameError}>
                {nicknameError}
              </HelperText>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="设置密码"
                value={password}
                onChangeText={handlePasswordChange}
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
                placeholder="请设置密码（至少6位）"
              />
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
              
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    密码强度：{passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputWrapper}>
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
                autoCapitalize="none"
                error={!!confirmPasswordError}
                left={<TextInput.Icon icon="lock-check" color={COLORS.primary} />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    color={COLORS.textSecondary}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                contentStyle={styles.inputContent}
                placeholder="请再次输入密码"
              />
              <HelperText type="error" visible={!!confirmPasswordError}>
                {confirmPasswordError}
              </HelperText>
            </View>

            <View style={styles.termsRow}>
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  我已阅读并同意
                  <Text style={styles.termsLink}> 《用户协议》</Text>
                  和
                  <Text style={styles.termsLink}> 《隐私政策》</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              disabled={isLoading || !agreedToTerms}
              labelStyle={styles.registerButtonLabel}
              buttonColor={COLORS.primary}
            >
              立即注册
            </Button>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>已有账号？</Text>
              <Button
                mode="text"
                onPress={handleBackToLogin}
                labelStyle={styles.loginButtonLabel}
                textColor={COLORS.primary}
              >
                返回登录
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
          <Text style={styles.footerText}>安全注册 · 健康守护</Text>
        </View>
      </ScrollView>

      <LoadingSpinner loading={isLoading} text="正在注册..." />
    </KeyboardAvoidingView>
  );
};

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  headerGradient: {
    paddingTop: height * 0.05,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'Nunito_ExtraBold',
  },
  appSlogan: {
    fontSize: 15,
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
    marginTop: -20,
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    ...SHADOWS.large,
  },

  errorContainer: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
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

  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Lato_Medium',
  },

  termsRow: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
    marginTop: 2,
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
  termsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    fontFamily: 'Lato_Regular',
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  registerButton: {
    borderRadius: 22,
    minHeight: 58,
  },
  registerButtonContent: {
    height: 58,
  },
  registerButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
    letterSpacing: 4,
  },

  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },

  footerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerBadges: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  footerBadge: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
