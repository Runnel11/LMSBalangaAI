import React, { createContext, useContext, useEffect, useState } from 'react';
import { networkService } from '../services/networkService';
import { offlineManager } from '../services/offlineManager';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [offlineData, setOfflineData] = useState(null);

  useEffect(() => {
    initializeOfflineManager();

    return () => {
      offlineManager.cleanup();
    };
  }, []);

  const initializeOfflineManager = async () => {
    try {
      // Initialize offline manager
      await offlineManager.initialize();

      // Get initial status
      const status = offlineManager.getOfflineStatus();
      setIsOnline(status.isOnline);
      setConnectionType(status.connectionType);
      setPendingSyncCount(status.pendingSyncCount);

      // Load offline data
      const cachedData = await offlineManager.getOfflineData();
      setOfflineData(cachedData);

      // Listen for network changes
      const unsubscribe = networkService.addListener((online, connType) => {
        setIsOnline(online);
        setConnectionType(connType);

        // Update pending sync count after network changes
        setTimeout(async () => {
          const updatedStatus = offlineManager.getOfflineStatus();
          setPendingSyncCount(updatedStatus.pendingSyncCount);
        }, 1000);
      });

      setIsInitialized(true);

      // Cache essential data if first time or if cache is old
      if (!cachedData || isDataStale(cachedData.cachedAt)) {
        await refreshOfflineData();
      }

    } catch (error) {
      console.error('Error initializing offline manager:', error);
      setIsInitialized(true); // Still set to true to allow app to function
    }
  };

  const isDataStale = (cachedAt) => {
    if (!cachedAt) return true;

    const cacheTime = new Date(cachedAt);
    const now = new Date();
    const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);

    return hoursSinceCache > 24; // Consider stale after 24 hours
  };

  const refreshOfflineData = async () => {
    if (!isOnline) {
      console.log('Cannot refresh offline data: currently offline');
      return false;
    }

    try {
      const success = await offlineManager.cacheEssentialData();
      if (success) {
        const updatedData = await offlineManager.getOfflineData();
        setOfflineData(updatedData);
      }
      return success;
    } catch (error) {
      console.error('Error refreshing offline data:', error);
      return false;
    }
  };

  const saveProgress = async (lessonId, quizId = null, score = null, isCompleted = true) => {
    try {
      const success = await offlineManager.saveUserProgress(lessonId, quizId, score, isCompleted);

      // Update pending sync count
      const status = offlineManager.getOfflineStatus();
      setPendingSyncCount(status.pendingSyncCount);

      return success;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  };

  const getConnectionStatus = () => {
    return {
      isOnline,
      connectionType,
      hasReliableConnection: networkService.hasReliableConnection(),
      shouldSyncOnCellular: networkService.shouldSyncOnCellular()
    };
  };

  const getOfflineStatusMessage = () => {
    if (isOnline) {
      if (pendingSyncCount > 0) {
        return `Online (${pendingSyncCount} items syncing)`;
      }
      return `Online (${connectionType})`;
    } else {
      if (offlineData) {
        return 'Offline mode';
      }
      return 'Offline - Limited functionality';
    }
  };

  const value = {
    // Status
    isOnline,
    connectionType,
    pendingSyncCount,
    isInitialized,
    offlineData,

    // Actions
    saveProgress,
    refreshOfflineData,

    // Utilities
    getConnectionStatus,
    getOfflineStatusMessage,

    // Raw access to managers (for advanced usage)
    offlineManager,
    networkService
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};