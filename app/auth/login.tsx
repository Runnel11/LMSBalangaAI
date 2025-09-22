import { Logo } from '@/src/components/ui/Logo';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { logger } from '@/src/utils/logger';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();

  // Animation refs
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const emailShakeAnim = useRef(new Animated.Value(0)).current;
  const passwordShakeAnim = useRef(new Animated.Value(0)).current;

  // Animation functions
  const showErrorAnimation = () => {
    Animated.sequence([
      Animated.timing(errorFadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const shakeInput = (animValue) => {
    Animated.sequence([
      Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const hideErrorAnimation = () => {
    Animated.timing(errorFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Animate errors when they appear
  useEffect(() => {
    if (error || emailError || passwordError) {
      showErrorAnimation();

      // Shake the inputs that have errors
      if (emailError) shakeInput(emailShakeAnim);
      if (passwordError) shakeInput(passwordShakeAnim);
    }
  }, [error, emailError, passwordError]);

  const validateForm = () => {
    let isValid = true;
    setError('');
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      return isValid;
    }

    
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    console.log('🔐 Login attempt:', { email: email.trim().toLowerCase(), hasPassword: !!password });
    const result = await login(email.trim().toLowerCase(), password);
    console.log('🔐 Login result:', { success: result.success, errorType: result.errorType, error: result.error });

    if (result.success) {
      console.log('✅ Login successful, navigating to home');
      // Navigation will be handled by the auth context
      router.replace('/(tabs)');
    } else {
      // Handle specific error types with better UX - show inline errors
      console.log('🔐 Login failed with error type:', result.errorType);
      console.log('🔐 Error message:', result.error);

      if (result.errorType === 'account_not_found') {
        console.log('Account not found - setting error messages');
        logger.auth.loginFailure('Account not found', 'account_not_found');
        setError('Invalid email or password. Please check your credentials.');
        setEmailError('Account not found');

        // Also show alert with option to create account
        Alert.alert(
          'Account Not Found',
          'No account found with this email address. Would you like to create an account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => {
                router.push({
                  pathname: '/auth/signup',
                  params: { email: email.trim().toLowerCase() }
                });
              }
            }
          ]
        );
      } else {
        // Handle other error types with inline error messages
        let errorMessage = result.error || 'Invalid email or password. Please try again.';

        switch (result.errorType) {
          case 'network_error':
            errorMessage = 'Connection error. Please check your internet connection.';
            break;
          case 'http_error':
            errorMessage = 'Server error. Please try again later.';
            break;
          case 'response_format_error':
            errorMessage = 'Service error. Please try again.';
            break;
          case 'client_error':
            errorMessage = 'Login failed. Please check your credentials and try again.';
            break;
          case 'unexpected_response':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            setEmailError('Please verify your email');
            setPasswordError('Please verify your password');
            break;
          default:
            // For unknown errors or invalid credentials
            if (result.error && (
              result.error.toLowerCase().includes('credential') ||
              result.error.toLowerCase().includes('password') ||
              result.error.toLowerCase().includes('invalid') ||
              result.error.toLowerCase().includes('authentication failed')
            )) {
              errorMessage = 'Invalid email or password. Please check your credentials.';
              setEmailError('Please check your email');
              setPasswordError('Please check your password');
            }
            break;
        }

        logger.auth.loginFailure(errorMessage, result.errorType || 'unknown');
        setError(errorMessage);
      }
    }

    setIsLoading(false);
  };

  const clearErrors = () => {
    hideErrorAnimation();
    setTimeout(() => {
      setError('');
      setEmailError('');
      setPasswordError('');
    }, 200);
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo size="large" showText={true} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          <View style={styles.form}>
            {/* General error message */}
            {error ? (
              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorFadeAnim,
                    transform: [{
                      translateY: errorFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0]
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <Animated.View
                style={{
                  transform: [{ translateX: emailShakeAnim }]
                }}
              >
                <TextInput
                  style={[
                    styles.input,
                    emailError ? styles.inputError : null
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError || error) clearErrors(); // Clear errors on edit
                  }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </Animated.View>
              {emailError ? (
                <Animated.View
                  style={{
                    opacity: errorFadeAnim,
                    transform: [{
                      translateY: errorFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 0]
                      })
                    }]
                  }}
                >
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                </Animated.View>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <Animated.View
                style={{
                  transform: [{ translateX: passwordShakeAnim }]
                }}
              >
                <TextInput
                  style={[
                    styles.input,
                    passwordError ? styles.inputError : null
                  ]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError || error) clearErrors(); // Clear errors on edit
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
                  editable={!isLoading}
                />
              </Animated.View>
              {passwordError ? (
                <Animated.View
                  style={{
                    opacity: errorFadeAnim,
                    transform: [{
                      translateY: errorFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 0]
                      })
                    }]
                  }}
                >
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </Animated.View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={navigateToSignup} disabled={isLoading}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    ...typography.body1,
    backgroundColor: colors.surface, // White background
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    minHeight: 48,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  loginButtonText: {
    ...typography.button,
    color: colors.surface, // White text
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  signupLink: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error + '10', // Light red background
    borderWidth: 1,
    borderColor: colors.error + '30',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.body2,
    color: colors.error,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  fieldErrorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});