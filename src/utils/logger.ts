/**
 * Centralized logging utility for BalangaAI LMS
 * Provides actionable console messages for debugging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'AUTH' | 'DB' | 'API' | 'NAVIGATION' | 'OFFLINE' | 'DOWNLOAD' | 'QUIZ' | 'GENERAL';

interface LogContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDev = __DEV__;
  private logLevel: LogLevel = this.isDev ? 'debug' : 'error';

  private formatMessage(category: LogCategory, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;

    if (context) {
      const contextStr = Object.entries(context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');

      return `${prefix} ${message} | ${contextStr}`;
    }

    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private log(level: LogLevel, category: LogCategory, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(category, message, context);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  // Authentication logging
  auth = {
    loginAttempt: (email: string) => {
      this.log('info', 'AUTH', 'Login attempt started', { action: 'login_attempt', metadata: { email } });
    },
    loginSuccess: (userId: string) => {
      this.log('info', 'AUTH', 'Login successful', { userId, action: 'login_success' });
    },
    loginFailure: (error: string, errorType?: string) => {
      this.log('error', 'AUTH', 'Login failed', { action: 'login_failure', metadata: { error, errorType } });
    },
    logout: (userId?: string) => {
      this.log('info', 'AUTH', 'User logged out', { userId, action: 'logout' });
    },
    signupAttempt: (email: string) => {
      this.log('info', 'AUTH', 'Signup attempt started', { action: 'signup_attempt', metadata: { email } });
    },
    signupSuccess: (userId: string) => {
      this.log('info', 'AUTH', 'Signup successful', { userId, action: 'signup_success' });
    },
    signupFailure: (error: string) => {
      this.log('error', 'AUTH', 'Signup failed', { action: 'signup_failure', metadata: { error } });
    },
  };

  // Database logging
  db = {
    initialized: () => {
      this.log('info', 'DB', 'Database initialized successfully');
    },
    error: (operation: string, error: string) => {
      this.log('error', 'DB', `Database operation failed: ${operation}`, { action: 'db_error', metadata: { error } });
    },
    query: (operation: string, table: string, duration?: number) => {
      this.log('debug', 'DB', `Database query: ${operation} on ${table}`, { action: 'db_query', metadata: { operation, table, duration } });
    },
    migration: (version: string, success: boolean) => {
      this.log(success ? 'info' : 'error', 'DB', `Database migration ${success ? 'completed' : 'failed'}`, { action: 'db_migration', metadata: { version, success } });
    },
  };

  // API logging
  api = {
    request: (endpoint: string, method: string) => {
      this.log('debug', 'API', `API request: ${method} ${endpoint}`, { action: 'api_request', metadata: { endpoint, method } });
    },
    success: (endpoint: string, duration: number, responseSize?: number) => {
      this.log('info', 'API', `API success: ${endpoint}`, { action: 'api_success', metadata: { endpoint, duration, responseSize } });
    },
    error: (endpoint: string, error: string, statusCode?: number) => {
      this.log('error', 'API', `API error: ${endpoint}`, { action: 'api_error', metadata: { endpoint, error, statusCode } });
    },
    timeout: (endpoint: string, timeout: number) => {
      this.log('warn', 'API', `API timeout: ${endpoint}`, { action: 'api_timeout', metadata: { endpoint, timeout } });
    },
  };

  // Navigation logging
  navigation = {
    screenChange: (from: string, to: string, userId?: string) => {
      this.log('debug', 'NAVIGATION', `Screen transition: ${from} → ${to}`, { userId, action: 'screen_change', metadata: { from, to } });
    },
    deepLink: (url: string, params?: Record<string, any>) => {
      this.log('info', 'NAVIGATION', `Deep link opened: ${url}`, { action: 'deep_link', metadata: { url, params } });
    },
    routeError: (route: string, error: string) => {
      this.log('error', 'NAVIGATION', `Route error: ${route}`, { action: 'route_error', metadata: { route, error } });
    },
  };

  // Offline functionality logging
  offline = {
    statusChange: (isOnline: boolean) => {
      this.log('info', 'OFFLINE', `Network status changed: ${isOnline ? 'online' : 'offline'}`, { action: 'network_status_change', metadata: { isOnline } });
    },
    syncStart: () => {
      this.log('info', 'OFFLINE', 'Offline sync started', { action: 'sync_start' });
    },
    syncComplete: (itemsSynced: number) => {
      this.log('info', 'OFFLINE', 'Offline sync completed', { action: 'sync_complete', metadata: { itemsSynced } });
    },
    syncError: (error: string) => {
      this.log('error', 'OFFLINE', 'Offline sync failed', { action: 'sync_error', metadata: { error } });
    },
  };

  // Download management logging
  download = {
    started: (lessonId: string, userId?: string) => {
      this.log('info', 'DOWNLOAD', `Download started for lesson ${lessonId}`, { userId, action: 'download_start', metadata: { lessonId } });
    },
    progress: (lessonId: string, percentage: number) => {
      this.log('debug', 'DOWNLOAD', `Download progress: ${percentage}%`, { action: 'download_progress', metadata: { lessonId, percentage } });
    },
    completed: (lessonId: string, fileSize: number) => {
      this.log('info', 'DOWNLOAD', `Download completed for lesson ${lessonId}`, { action: 'download_complete', metadata: { lessonId, fileSize } });
    },
    failed: (lessonId: string, error: string) => {
      this.log('error', 'DOWNLOAD', `Download failed for lesson ${lessonId}`, { action: 'download_error', metadata: { lessonId, error } });
    },
  };

  // Quiz and learning logging
  quiz = {
    started: (quizId: string, userId?: string) => {
      this.log('info', 'QUIZ', `Quiz started: ${quizId}`, { userId, action: 'quiz_start', metadata: { quizId } });
    },
    completed: (quizId: string, score: number, timeSpent: number, userId?: string) => {
      this.log('info', 'QUIZ', `Quiz completed: ${quizId}`, { userId, action: 'quiz_complete', metadata: { quizId, score, timeSpent } });
    },
    questionAnswered: (quizId: string, questionIndex: number, isCorrect: boolean) => {
      this.log('debug', 'QUIZ', `Question answered in quiz ${quizId}`, { action: 'quiz_question', metadata: { quizId, questionIndex, isCorrect } });
    },
  };

  // General purpose logging
  general = {
    appStart: (version: string) => {
      this.log('info', 'GENERAL', `App started - version ${version}`, { action: 'app_start', metadata: { version } });
    },
    appError: (error: string, stack?: string) => {
      this.log('error', 'GENERAL', 'Unhandled app error', { action: 'app_error', metadata: { error, stack } });
    },
    performance: (metric: string, value: number, unit: string) => {
      this.log('debug', 'GENERAL', `Performance metric: ${metric}`, { action: 'performance', metadata: { metric, value, unit } });
    },
  };

  // Performance and diagnostics
  startTimer = (label: string): (() => void) => {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.general.performance(label, duration, 'ms');
    };
  };
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };