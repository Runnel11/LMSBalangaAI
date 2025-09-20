import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      // Navigation will be handled by the auth context
      router.replace('/(tabs)');
    } else {
      // Handle specific error types with better UX
      console.log('🔐 Login failed with error type:', result.errorType);
      console.log('🔐 Error message:', result.error);

      if (result.errorType === 'account_not_found') {
        Alert.alert(
          'Account Not Found',
          'No account found with this email address. Would you like to create an account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => {
                // Navigate to signup with pre-filled email
                router.push({
                  pathname: '/auth/signup',
                  params: { email: email.trim().toLowerCase() }
                });
              }
            }
          ]
        );
      } else {
        // Handle other error types with appropriate messaging
        let errorTitle = 'Login Failed';
        let errorMessage = result.error || 'Please check your credentials';

        switch (result.errorType) {
          case 'network_error':
            errorTitle = 'Connection Error';
            errorMessage = 'Please check your internet connection and try again.';
            break;
          case 'http_error':
            errorTitle = 'Server Error';
            errorMessage = 'Server is temporarily unavailable. Please try again later.';
            break;
          case 'response_format_error':
            errorTitle = 'Service Error';
            errorMessage = 'There was a problem with the service. Please try again.';
            break;
          default:
            // Use the error message from the server for other cases
            break;
        }

        Alert.alert(errorTitle, errorMessage);
      }
    }

    setIsLoading(false);
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
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                editable={!isLoading}
              />
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
});