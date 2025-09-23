import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAllLevels, getCurrentUserId, getLessonsByLevel,
    getProgress,
    saveProgress
} from '../db/index';
import { logger } from '../utils/logger';
import { bubbleApi } from './bubbleApi';
import { networkService } from './networkService';
import { syncService } from './syncService';

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
    this.subscribers = new Set();
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
      logger.offline.statusChange(networkService.isOnline);
    } catch (error) {
      logger.offline.syncError(String(error));
    }
  }

  // Handle network connectivity changes
  handleNetworkChange = async (isOnline, connectionType) => {
    if (isOnline) {
        logger.offline.statusChange(true);
      await this.syncPendingData();

      // Auto-download if on WiFi and setting is enabled
      if (connectionType === 'wifi' && this.settings.autoDownloadOnWifi) {
        await this.autoDownloadEssentialContent();
      }
    } else {
        logger.offline.statusChange(false);
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
        logger.offline.syncStart();

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

  // Notify subscribers so UI can update immediately
  this.notifySubscribers();

        logger.offline.syncComplete(data.levels.length + Object.keys(data.lessons).length);
      return true;
    } catch (error) {
        logger.offline.syncError(String(error));
      return false;
    }
  }

  // Auto-download essential content when on WiFi
  async autoDownloadEssentialContent() {
    if (!networkService.hasReliableConnection()) {
        logger.offline.statusChange(false);
      return;
    }

    try {
        logger.download.started('essential');

      const levels = await getAllLevels();

      for (const level of levels.slice(0, 2)) { // Download first 2 levels
        const lessons = await getLessonsByLevel(level.id);

        // Download first few lessons in each level
        for (const lesson of lessons.slice(0, 3)) {
          if (!lesson.is_downloaded) {
            // Note: This would require integration with your download manager
              logger.download.started(String(lesson.id));
          }
        }
      }
    } catch (error) {
        logger.download.failed('essential', String(error));
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

        logger.offline.syncStart();
    } catch (error) {
        logger.offline.syncError(String(error));
    }
  }

  // Sync pending data when back online
  async syncPendingData() {
    if (!networkService.isOnline || this.pendingSyncData.length === 0) {
      return;
    }

      logger.offline.syncStart();

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of this.pendingSyncData) {
      try {
        let success = false;

        switch (item.action) {
          case 'saveProgress':
            // Always ensure local save
            await saveProgress(
              item.data.lessonId,
              item.data.quizId,
              item.data.score,
              item.data.isCompleted
            );
            // If user is known, opportunistically upsert to Bubble
            try {
              const userIdNow = getCurrentUserId?.() || null;
              if (userIdNow && networkService.isOnline) {
                await bubbleApi.upsertProgress({
                  user_id: userIdNow,
                  lesson_id: item.data.lessonId,
                  quiz_id: item.data.quizId,
                  is_completed: !!item.data.isCompleted,
                  score: item.data.score,
                });
              }
            } catch (e) {
              // Non-fatal: keep success true so we don't block the queue; upsert will retry via future actions
              logger.offline.syncError('Non-fatal upsert failure during syncPendingData');
            }
            success = true;
            break;

          case 'syncUserProgress':
            // Only attempt if we have a valid user id
            if (syncService.syncToBubble && item.data.userId) {
              await syncService.syncToBubble(item.data.userId);
              success = true;
            } else {
              // No user id available; nothing to do now. Drop the item to avoid sticky pending counts.
              success = true;
            }
            break;

          default:
            logger.offline.syncError(`Unknown sync action: ${item.action}`);
        }

        if (success) {
          successfulSyncs.push(item.id);
        } else {
          item.retryCount++;
          if (item.retryCount >= 3) {
            logger.offline.syncError('Max retries reached for sync item');
            failedSyncs.push(item.id);
          }
        }
      } catch (error) {
          logger.offline.syncError(String(error));
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

      logger.offline.syncComplete(successfulSyncs.length);
  }

  // Save progress (works offline and online)
  /**
   * @param {string|number} lessonId
   * @param {string|number|null} [quizId]
   * @param {number|null} [score]
   * @param {boolean} [isCompleted]
   */
  async saveUserProgress(lessonId, quizId = undefined, score = undefined, isCompleted = true) {
    try {
      // Always save locally first
      await saveProgress(lessonId, quizId, score, isCompleted);

      if (networkService.isOnline) {
        // Try to sync immediately if online (write-through)
        try {
          const userId = getCurrentUserId?.() || null;
          if (userId) {
            await bubbleApi.upsertProgress({
              user_id: userId,
              lesson_id: lessonId,
              quiz_id: quizId,
              is_completed: !!isCompleted,
              score,
            });
          } else {
            // If no user scope, do not queue a server sync item; keep local only
          }
            logger.offline.syncComplete(1);
        } catch (syncError) {
            logger.offline.syncError('Online write-through failed, queued for retry');
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
          logger.offline.syncStart();
      }

      return true;
    } catch (error) {
        logger.offline.syncError(String(error));
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
        logger.offline.syncError(String(error));
      this.offlineData = null;
    }
  }

  // Load pending sync data from storage
  async loadPendingSyncData() {
    try {
      const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      this.pendingSyncData = data ? JSON.parse(data) : [];
    } catch (error) {
        logger.offline.syncError(String(error));
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
        logger.offline.syncError(String(error));
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
        logger.offline.syncComplete(0);
      this.notifySubscribers();
    } catch (error) {
        logger.offline.syncError(String(error));
    }
  }

  // Cleanup
  cleanup() {
    networkService.cleanup();
  }

  // Subscribe to cache updates (UI can refresh immediately)
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
    return () => {};
  }

  notifySubscribers() {
    for (const cb of this.subscribers) {
      try {
        cb(this.offlineData);
      } catch (e) {
          logger.offline.syncError(String(e));
      }
    }
  }
}

// Default instance
export const offlineManager = new OfflineManager();