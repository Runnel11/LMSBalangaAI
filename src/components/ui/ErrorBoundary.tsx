import { Logo } from '@/src/components/ui/Logo';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { router } from 'expo-router';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to analytics/crash reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Actionable logging for debugging
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location?.href : 'native',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    console.group('🚨 Error Boundary - Actionable Debug Info');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Data:', errorData);
    console.groupEnd();

    // Future: Send to crash reporting service
    // crashlytics().recordError(error);
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Navigate to home and reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    try {
      router.replace('/(tabs)');
    } catch (navError) {
      console.error('🚨 Navigation error in ErrorBoundary:', navError);
      // Fallback: try to reload the app
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.logoContainer}>
              <Logo size="large" showText={true} />
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.title}>Oops! Something went wrong</Text>
              <Text style={styles.subtitle}>
                We&apos;re sorry, but something unexpected happened. Don&apos;t worry - your progress is saved.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Debug Info (Dev Mode)</Text>
                  <Text style={styles.debugText}>{this.state.error.message}</Text>
                  {this.state.error.stack && (
                    <Text style={styles.debugStack} numberOfLines={10}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Try Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleGoHome}
                accessibilityLabel="Go back to home"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helpText}>
              If this problem persists, please restart the app or contact support.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  content: ViewStyle;
  logoContainer: ViewStyle;
  errorContainer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  debugContainer: ViewStyle;
  debugTitle: TextStyle;
  debugText: TextStyle;
  debugStack: TextStyle;
  actionsContainer: ViewStyle;
  button: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  buttonText: TextStyle;
  primaryButtonText: TextStyle;
  secondaryButtonText: TextStyle;
  helpText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    ...(typography.h1 as any),
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...(typography.body1 as any),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  debugContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    maxWidth: '100%',
  },
  debugTitle: {
    ...(typography.body2 as any),
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  debugText: {
    ...(typography.caption as any),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  debugStack: {
    ...(typography.caption as any),
    color: colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    ...(typography.button as any),
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.surface,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  helpText: {
    ...(typography.caption as any),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});