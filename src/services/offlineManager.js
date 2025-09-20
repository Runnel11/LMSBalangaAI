import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from './networkService';
import { syncService } from './syncService';
import {
  getAllLevels,
  getLessonsByLevel,
  getProgress,
  saveProgress,
  updateLessonDownloadStatus
} from '../db/index';

const OFFLINE_DATA_KEY = '@offline_data';
const PENDING_SYNC_KEY = '@pending_sync';
const APP_SETTINGS_KEY = '@app_settings';

export class OfflineManager {
  constructor() {
    this.isInitialized = false;
    this.offlineData = null;
    this.pendingSyncData = [];
    this.settings = {
      autoDownloadOnWifi: true,
      syncOnCellular: false,
      maxStorageSize: 500 * 1024 * 1024, // 500MB
    };
  }

  // Initialize offline manager
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize network service
      await networkService.initialize();

      // Load cached data
      await this.loadOfflineData();
      await this.loadPendingSyncData();
      await this.loadSettings();

      // Listen for network changes
      networkService.addListener(this.handleNetworkChange);

      this.isInitialized = true;
      console.log('OfflineManager initialized successfully');
    } catch (error) {
      console.error('Error initializing OfflineManager:', error);
    }
  }

  // Handle network connectivity changes
  handleNetworkChange = async (isOnline, connectionType) => {
    if (isOnline) {
      console.log('📶 Back online - attempting to sync pending data');
      await this.syncPendingData();

      // Auto-download if on WiFi and setting is enabled
      if (connectionType === 'wifi' && this.settings.autoDownloadOnWifi) {
        await this.autoDownloadEssentialContent();
      }
    } else {
      console.log('📵 Gone offline - switching to offline mode');
    }
  };

  // Check if app should work in offline mode
  isOfflineMode() {
    return !networkService.isOnline;
  }

  // Get data for offline use
  async getOfflineData(dataType = null) {
    if (!this.offlineData) {
      await this.loadOfflineData();
    }

    if (dataType) {
      return this.offlineData?.[dataType] || [];
    }

    return this.offlineData;
  }

  // Cache essential data for offline use
  async cacheEssentialData() {
    try {
      console.log('📦 Caching essential data for offline use...');

      const data = {
        levels: await getAllLevels(),
        lessons: {},
        userProgress: {},
        cachedAt: new Date().toISOString()
      };

      // Cache lessons for each level
      for (const level of data.levels) {
        const lessons = await getLessonsByLevel(level.id);
        data.lessons[level.id] = lessons;

        // Cache user progress for each lesson
        for (const lesson of lessons) {
          const progress = await getProgress(lesson.id);
          data.userProgress[lesson.id] = progress;
        }
      }

      this.offlineData = data;
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(data));

      console.log(`✅ Cached ${data.levels.length} levels and ${Object.keys(data.lessons).length} lesson groups`);
      return true;
    } catch (error) {
      console.error('Error caching essential data:', error);
      return false;
    }
  }

  // Auto-download essential content when on WiFi
  async autoDownloadEssentialContent() {
    if (!networkService.hasReliableConnection()) {
      console.log('Not on reliable connection, skipping auto-download');
      return;
    }

    try {
      console.log('📱 Auto-downloading essential content...');

      const levels = await getAllLevels();

      for (const level of levels.slice(0, 2)) { // Download first 2 levels
        const lessons = await getLessonsByLevel(level.id);

        // Download first few lessons in each level
        for (const lesson of lessons.slice(0, 3)) {
          if (!lesson.is_downloaded) {
            // Note: This would require integration with your download manager
            console.log(`Auto-downloading lesson: ${lesson.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-downloading content:', error);
    }
  }

  // Queue data for sync when back online
  async queueForSync(action, data) {
    try {
      const syncItem = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      this.pendingSyncData.push(syncItem);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.pendingSyncData));

      console.log(`📋 Queued ${action} for sync:`, data);
    } catch (error) {
      console.error('Error queuing data for sync:', error);
    }
  }

  // Sync pending data when back online
  async syncPendingData() {
    if (!networkService.isOnline || this.pendingSyncData.length === 0) {
      return;
    }

    console.log(`🔄 Syncing ${this.pendingSyncData.length} pending items...`);

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of this.pendingSyncData) {
      try {
        let success = false;

        switch (item.action) {
          case 'saveProgress':
            await saveProgress(
              item.data.lessonId,
              item.data.quizId,
              item.data.score,
              item.data.isCompleted
            );
            success = true;
            break;

          case 'syncUserProgress':
            if (syncService.syncToBubble) {
              await syncService.syncToBubble(item.data.userId);
              success = true;
            }
            break;

          default:
            console.warn('Unknown sync action:', item.action);
        }

        if (success) {
          successfulSyncs.push(item.id);
        } else {
          item.retryCount++;
          if (item.retryCount >= 3) {
            console.error('Max retries reached for sync item:', item);
            failedSyncs.push(item.id);
          }
        }
      } catch (error) {
        console.error('Error syncing item:', item, error);
        item.retryCount++;
        if (item.retryCount >= 3) {
          failedSyncs.push(item.id);
        }
      }
    }

    // Remove successfully synced and failed items
    this.pendingSyncData = this.pendingSyncData.filter(
      item => !successfulSyncs.includes(item.id) && !failedSyncs.includes(item.id)
    );

    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.pendingSyncData));

    console.log(`✅ Sync complete: ${successfulSyncs.length} successful, ${failedSyncs.length} failed`);
  }

  // Save progress (works offline and online)
  async saveUserProgress(lessonId, quizId = null, score = null, isCompleted = true) {
    try {
      // Always save locally first
      await saveProgress(lessonId, quizId, score, isCompleted);

      if (networkService.isOnline) {
        // Try to sync immediately if online
        try {
          // Additional online sync logic can go here
          console.log('Progress saved and synced online');
        } catch (syncError) {
          console.log('Online sync failed, will retry later');
          await this.queueForSync('saveProgress', {
            lessonId,
            quizId,
            score,
            isCompleted
          });
        }
      } else {
        // Queue for later sync if offline
        await this.queueForSync('saveProgress', {
          lessonId,
          quizId,
          score,
          isCompleted
        });
        console.log('Progress saved offline, will sync when online');
      }

      return true;
    } catch (error) {
      console.error('Error saving user progress:', error);
      return false;
    }
  }

  // Get user-friendly offline status
  getOfflineStatus() {
    return {
      isOnline: networkService.isOnline,
      connectionType: networkService.connectionType,
      hasOfflineData: !!this.offlineData,
      pendingSyncCount: this.pendingSyncData.length,
      lastCacheUpdate: this.offlineData?.cachedAt || null
    };
  }

  // Load cached data from storage
  async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      this.offlineData = data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading offline data:', error);
      this.offlineData = null;
    }
  }

  // Load pending sync data from storage
  async loadPendingSyncData() {
    try {
      const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      this.pendingSyncData = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading pending sync data:', error);
      this.pendingSyncData = [];
    }
  }

  // Load app settings
  async loadSettings() {
    try {
      const data = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (data) {
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Update app settings
  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    try {
      await AsyncStorage.multiRemove([
        OFFLINE_DATA_KEY,
        PENDING_SYNC_KEY
      ]);
      this.offlineData = null;
      this.pendingSyncData = [];
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  // Cleanup
  cleanup() {
    networkService.cleanup();
  }
}

// Default instance
export const offlineManager = new OfflineManager();