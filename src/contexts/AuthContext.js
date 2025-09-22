import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { repairProgressData, setCurrentUserId } from '../db/index';
import { bubbleApi } from '../services/bubbleApi';
import { syncService } from '../services/syncService';
import { logger } from '../utils/logger';

// Secure storage - will use different implementations for web vs mobile
let secureStore;
if (Platform.OS === 'web') {
  // For web, use localStorage (in production, consider more secure alternatives)
  secureStore = {
    setItemAsync: async (key, value) => {
      localStorage.setItem(key, value);
    },
    getItemAsync: async (key) => {
      return localStorage.getItem(key);
    },
    deleteItemAsync: async (key) => {
      localStorage.removeItem(key);
    }
  };
} else {
  // For mobile, use SecureStore if available, fallback to AsyncStorage
  try {
    secureStore = SecureStore;
  } catch (error) {
    console.warn('Expo SecureStore not available, using AsyncStorage');
    secureStore = {
      setItemAsync: AsyncStorage.setItem,
      getItemAsync: AsyncStorage.getItem,
      deleteItemAsync: AsyncStorage.removeItem
    };
  }
}

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // Check for stored authentication on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  // Start sync service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && authToken) {
      // Update Bubble API with the auth token
      bubbleApi.setAuthToken(authToken);
      syncService.startPeriodicSync(user.id || user._id);
      // Force initial sync
      syncService.forceSync(user.id || user._id);
    } else {
      syncService.stopPeriodicSync();
    }

    return () => {
      syncService.stopPeriodicSync();
    };
  }, [isAuthenticated, user, authToken]);

  const checkStoredAuth = async () => {
    const timer = logger.startTimer('Auth check stored');
    try {
      logger.auth.loginAttempt('stored_session');
      const token = await secureStore.getItemAsync('auth_token');
      const userData = await secureStore.getItemAsync('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);

        // Validate token is still valid
        const isValidToken = await bubbleApi.validateToken(token);
        if (!isValidToken) {
          logger.auth.loginFailure('Token expired', 'token_expired');
          await clearStoredAuth();
          timer();
          return;
        }

        // Set auth token for API calls
        setAuthToken(token);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Scope DB operations to this user
        const uid = parsedUser.id || parsedUser._id || 1;
        setCurrentUserId(uid);

        // Attempt to repair any legacy progress rows
        try {
          await repairProgressData();
          logger.auth.loginSuccess(uid);
        } catch (repairError) {
          logger.db.error('progress_repair', repairError.message);
        }
      }
    } catch (error) {
      logger.auth.loginFailure(error.message, 'stored_auth_error');
      await clearStoredAuth();
    } finally {
      timer();
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    await secureStore.deleteItemAsync('auth_token');
    await secureStore.deleteItemAsync('user_data');
  };

  const login = async (email, password) => {
    const timer = logger.startTimer('Login attempt');
    try {
      setIsLoading(true);
      logger.auth.loginAttempt(email);

      // Authenticate with Bubble using token-based auth
      const result = await bubbleApi.authenticateUser(email, password);

      if (result.success) {
        // Store authentication data
        await secureStore.setItemAsync('auth_token', result.token);
        await secureStore.setItemAsync('user_data', JSON.stringify(result.user));

        setAuthToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
  const uid = result.user.id || result.user._id || 1;
  setCurrentUserId(uid);
  repairProgressData();

        return { success: true };
      } else {
        // Return detailed error information including error type
        return {
          success: false,
          error: result.error,
          errorType: result.errorType || 'unknown_error',
          originalResponse: result.originalResponse
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
        errorType: 'client_error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);

      // Create user in Bubble
      const result = await bubbleApi.createUser(userData);

      if (result.success) {
        // Store authentication data
        await secureStore.setItemAsync('auth_token', result.token);
        await secureStore.setItemAsync('user_data', JSON.stringify(result.user));

        setAuthToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
  const uid = result.user.id || result.user._id || 1;
  setCurrentUserId(uid);
  repairProgressData();

        return { success: true };
      } else {
        // Return detailed error information including error type
        return {
          success: false,
          error: result.error,
          errorType: result.errorType || 'unknown_error',
          originalResponse: result.originalResponse
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'Signup failed. Please try again.',
        errorType: 'client_error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Clear stored authentication data
      await clearStoredAuth();

      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
  setCurrentUserId(null);

      // Clear token from API service
      bubbleApi.clearAuthToken();

      // Stop sync service
      syncService.stopPeriodicSync();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    // Force refresh authentication and sync data
    if (user && authToken) {
      await syncService.forceSync(user.id || user._id);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    authToken,
    login,
    signup,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};