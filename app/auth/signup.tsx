import { Logo } from '@/src/components/ui/Logo';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const { email: prefilledEmail } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: prefilledEmail || '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirectedFromLogin, setIsRedirectedFromLogin] = useState(!!prefilledEmail);

  // Error states
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { signup } = useAuth();

  // Animation refs
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const fieldShakeAnims = {
    firstName: useRef(new Animated.Value(0)).current,
    lastName: useRef(new Animated.Value(0)).current,
    email: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    confirmPassword: useRef(new Animated.Value(0)).current,
  };

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
    const hasErrors = error || Object.values(fieldErrors).some(err => err);
    if (hasErrors) {
      showErrorAnimation();

      // Shake fields that have errors
      Object.entries(fieldErrors).forEach(([field, fieldError]) => {
        if (fieldError) {
          shakeInput(fieldShakeAnims[field]);
        }
      });
    }
  }, [error, fieldErrors]);

  const clearErrors = () => {
    hideErrorAnimation();
    setTimeout(() => {
      setError('');
      setFieldErrors({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }, 200);
  };

  const setFieldError = (field: string, errorMessage: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: errorMessage }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (error || fieldErrors[field]) {
      clearErrors();
    }
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    let isValid = true;

    // Clear previous errors
    setError('');
    setFieldErrors({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    // Validate first name
    if (!firstName.trim()) {
      setFieldError('firstName', 'First name is required');
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      setFieldError('lastName', 'Last name is required');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setFieldError('email', 'Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setFieldError('email', 'Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setFieldError('password', 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setFieldError('password', 'Password must be at least 6 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const userData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    const result = await signup(userData);

    if (result.success) {
      // Navigation will be handled by the auth context
      router.replace('/(tabs)');
    } else {
      // Handle specific error types with inline error messages
      let errorMessage = result.error || 'Signup failed. Please try again.';

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
        case 'email_exists':
          errorMessage = 'An account with this email already exists.';
          setFieldError('email', 'Email already registered');
          break;
        default:
          // Handle any email-specific errors
          if (result.error && result.error.toLowerCase().includes('email')) {
            setFieldError('email', 'Email issue - please check and try again');
          }
          break;
      }

      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Logo size="large" showText={true} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                {isRedirectedFromLogin
                  ? 'Complete your account setup to get started'
                  : 'Join BalangaAI Academy and start learning'
                }
              </Text>
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
                <Text style={styles.label}>First Name</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: fieldShakeAnims.firstName }]
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      fieldErrors.firstName ? styles.inputError : null
                    ]}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    placeholder="Enter your first name"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </Animated.View>
                {fieldErrors.firstName ? (
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
                    <Text style={styles.fieldErrorText}>{fieldErrors.firstName}</Text>
                  </Animated.View>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: fieldShakeAnims.lastName }]
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      fieldErrors.lastName ? styles.inputError : null
                    ]}
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    placeholder="Enter your last name"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </Animated.View>
                {fieldErrors.lastName ? (
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
                    <Text style={styles.fieldErrorText}>{fieldErrors.lastName}</Text>
                  </Animated.View>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: fieldShakeAnims.email }]
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      fieldErrors.email ? styles.inputError : null
                    ]}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </Animated.View>
                {fieldErrors.email ? (
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
                    <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                  </Animated.View>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: fieldShakeAnims.password }]
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      fieldErrors.password ? styles.inputError : null
                    ]}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Create a password (min. 6 characters)"
                    secureTextEntry
                    editable={!isLoading}
                  />
                </Animated.View>
                {fieldErrors.password ? (
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
                    <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
                  </Animated.View>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <Animated.View
                  style={{
                    transform: [{ translateX: fieldShakeAnims.confirmPassword }]
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      fieldErrors.confirmPassword ? styles.inputError : null
                    ]}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    secureTextEntry
                    editable={!isLoading}
                  />
                </Animated.View>
                {fieldErrors.confirmPassword ? (
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
                    <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
                  </Animated.View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
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
  signupButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
  signupButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  signupButtonText: {
    ...typography.button,
    color: colors.surface, // White text
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  loginLink: {
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