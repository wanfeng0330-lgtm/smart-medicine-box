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

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { sendPasswordResetEmail, isLoading, error, clearError } = useCloudBaseAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

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

  const handleResetPassword = async () => {
    clearError();
    setEmailError('');

    if (!email) {
      setEmailError('请输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('请输入正确的邮箱格式');
      return;
    }

    const result = await sendPasswordResetEmail(email);
    if (result.success) {
      setEmailSent(true);
    }
  };

  const handleBackToLogin = () => {
    clearError();
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={GRADIENTS.header}
          style={styles.successGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.successContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✉️</Text>
            </View>
            <Text style={styles.successTitle}>邮件已发送</Text>
            <Text style={styles.successMessage}>
              重置密码邮件已发送至{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
              {'\n\n'}请查收邮件并按照指引重置密码
            </Text>
            
            <Button
              mode="contained"
              onPress={handleBackToLogin}
              style={styles.backButton}
              contentStyle={styles.backButtonContent}
              labelStyle={styles.backButtonLabel}
              buttonColor={COLORS.primary}
            >
              返回登录
            </Button>

            <TouchableOpacity onPress={() => setEmailSent(false)}>
              <Text style={styles.resendText}>未收到邮件？点击重新发送</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

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
                <Text style={styles.logoIcon}>🔐</Text>
              </View>
              <Text style={styles.appName}>找回密码</Text>
              <Text style={styles.appSlogan}>输入邮箱重置您的密码</Text>
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

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                请输入您注册时使用的邮箱地址，我们将发送重置密码的链接到该邮箱。
              </Text>
            </View>

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
                placeholder="请输入注册邮箱"
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            </View>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              style={styles.resetButton}
              contentStyle={styles.resetButtonContent}
              disabled={isLoading}
              labelStyle={styles.resetButtonLabel}
              buttonColor={COLORS.primary}
            >
              发送重置邮件
            </Button>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>想起密码了？</Text>
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
          <Text style={styles.footerText}>安全验证 · 保护账号</Text>
        </View>
      </ScrollView>

      <LoadingSpinner loading={isLoading} text="正在发送..." />
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

  infoBox: {
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
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

  resetButton: {
    borderRadius: 22,
    minHeight: 58,
    marginTop: 16,
  },
  resetButtonContent: {
    height: 58,
  },
  resetButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
    letterSpacing: 2,
  },

  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  successGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 50,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Nunito_ExtraBold',
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    fontFamily: 'Lato_Regular',
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },
  backButton: {
    borderRadius: 22,
    width: '100%',
    minHeight: 58,
    marginBottom: 20,
  },
  backButtonContent: {
    height: 58,
  },
  backButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Lato_Medium',
  },
});
