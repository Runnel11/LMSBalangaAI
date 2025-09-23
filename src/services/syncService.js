import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllLevels,
  getLessonsByLevel,
  getProgress,
  insertJobFromBubble,
  insertLessonFromBubble,
  insertLevelFromBubble,
  insertQuizFromBubble,
  saveProgress
} from '../db/index';
import { logger } from '../utils/logger';
import { bubbleApi } from './bubbleApi';
import { networkService } from './networkService';
import { offlineManager } from './offlineManager';

export class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.lastSyncAt = null; // ISO string
  }

  async loadLastSyncAt() {
    try {
      const ts = await AsyncStorage.getItem('@last_sync_at');
      this.lastSyncAt = ts || null;
    } catch (e) {
      this.lastSyncAt = null;
    }
  }

  async saveLastSyncAt(ts) {
    try {
      await AsyncStorage.setItem('@last_sync_at', ts);
      this.lastSyncAt = ts;
    } catch (e) {
      // ignore
    }
  }

  // Check network connectivity using the enhanced network service
  async checkConnection() {
    try {
      const status = await networkService.getNetworkStatus();
      this.isOnline = status.isConnected;
      return this.isOnline;
    } catch (error) {
      logger.sync.error('Error checking connection', { metadata: { error: String(error) } });
      this.isOnline = false;
      return false;
    }
  }

  // Sync data from Bubble to local database
  async syncFromBubble() {
    if (this.syncInProgress) {
      logger.sync.skipped('already in progress');
      return;
    }

    // Check if we should sync on current connection type
    if (!networkService.isOnline) {
      logger.sync.skipped('offline');
      return;
    }

    if (!networkService.hasReliableConnection() && !networkService.shouldSyncOnCellular()) {
      logger.sync.skipped('not on reliable connection and cellular sync disabled');
      return;
    }

  this.syncInProgress = true;
  // Load stored last sync timestamp
  await this.loadLastSyncAt();
    logger.sync.start('Bubble');

    try {
      // Incremental sync using modified date when possible
      await this.syncLevelsFromBubble();
      await this.syncLessonsFromBubble();
      await this.syncQuizzesFromBubble?.();
      logger.sync.completed();
      await this.saveLastSyncAt(new Date().toISOString());
    } catch (error) {
      logger.sync.error('Sync from Bubble failed', { metadata: { error: String(error) } });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync user progress to Bubble
  async syncToBubble(userId) {
    if (!this.isOnline || !userId) {
      logger.sync.skipped('Cannot sync to Bubble: offline or no user');
      return;
    }

    try {
      const localProgress = await getProgress();

      for (const progress of localProgress) {
        // Idempotent upsert to avoid duplicates
        await bubbleApi.upsertProgress({
          user_id: userId,
          lesson_id: progress.lesson_id ?? null,
          quiz_id: progress.quiz_id ?? null,
          is_completed: progress.is_completed,
          score: progress.score,
          completed_at: progress.completed_at,
        });
      }

      logger.sync.completed({ items: localProgress?.length ?? 0, direction: 'push' });
    } catch (error) {
      logger.sync.error('Failed to sync progress to Bubble', { metadata: { error: String(error) } });
    }
  }

  // Pull user progress from Bubble into local DB
  async syncUserProgressFromBubble(userId) {
    if (!this.isOnline || !userId) {
      return;
    }
    try {
      const serverProgress = await bubbleApi.getUserProgress(userId);
      if (!Array.isArray(serverProgress)) return;

      for (const row of serverProgress) {
        // Normalize references: accept either object refs or ids
        const lessonId = row.lesson?._id || row.lesson || row.lesson_id || null;
        const quizId = row.quiz?._id || row.quiz || row.quiz_id || null;
        const isCompleted = typeof row.is_completed === 'boolean' ? row.is_completed : !!row.is_completed;
        const score = row.score ?? null;
        if (lessonId) {
          await saveProgress(String(lessonId), quizId ? String(quizId) : null, score, isCompleted);
        }
      }
      logger.sync.completed({ items: serverProgress.length, direction: 'pull' });
      // Refresh cached offline data so UI can reflect latest immediately
      try {
        // cacheEssentialData will notify subscribers via offlineManager
        await offlineManager.cacheEssentialData?.();
      } catch {}
    } catch (error) {
      logger.sync.error('Error syncing user progress from Bubble', { metadata: { error: String(error) } });
    }
  }

  // Initial content loading for first-time app installation
  async initialContentLoad() {
    try {
      await this.checkConnection();
      if (!this.isOnline) {
        logger.sync.skipped('Cannot load initial content: offline');
        return false;
      }

      logger.sync.start('Initial content load from Bubble');
      await this.loadLastSyncAt();

      // Load all content types in parallel
      const [levels, lessons, quizzes, jobs] = await Promise.all([
        bubbleApi.listLevels?.() || bubbleApi.syncLevels(),
        bubbleApi.listLessons?.() || bubbleApi.syncLessons(),
        bubbleApi.listQuizzes?.() || bubbleApi.syncQuizzes?.() || [],
        bubbleApi.syncJobs ? bubbleApi.syncJobs() : []
      ]);

      // Insert levels first (required for foreign keys)
      for (const level of levels) {
        await insertLevelFromBubble(level);
      }

      // Insert lessons
      for (const lesson of lessons) {
        await insertLessonFromBubble(lesson);
      }

      // Insert quizzes
      for (const quiz of quizzes) {
        await insertQuizFromBubble(quiz);
      }

      // Insert jobs
      for (const job of jobs) {
        await insertJobFromBubble(job);
      }

      logger.sync.completed({ levels: levels.length, lessons: lessons.length, quizzes: quizzes.length, jobs: jobs.length });
  await this.saveLastSyncAt(new Date().toISOString());
  return true;

    } catch (error) {
      logger.sync.error('Error loading initial content from Bubble', { metadata: { error: String(error) } });
      return false;
    }
  }

  // Sync levels from Bubble to local database
  async syncLevelsFromBubble() {
    try {
      const bubbleLevels = await (bubbleApi.listLevels?.(this.lastSyncAt) || bubbleApi.syncLevels());
      const localLevels = await getAllLevels();

      // Compare and update levels if needed
      for (const bubbleLevel of bubbleLevels) {
        const localLevel = localLevels.find(l => l.id === bubbleLevel._id);

        if (!localLevel || this.needsUpdate(localLevel, bubbleLevel)) {
          await insertLevelFromBubble(bubbleLevel);
          logger.sync.itemSynced('Level', bubbleLevel.title);
        }
      }
    } catch (error) {
      logger.sync.error('Error syncing levels from Bubble', { metadata: { error: String(error) } });
    }
  }

  // Sync lessons from Bubble to local database
  async syncLessonsFromBubble() {
    try {
      const bubbleLessons = await (bubbleApi.listLessons?.(this.lastSyncAt) || bubbleApi.syncLessons());

      // Group lessons by level and sync
      for (const bubbleLesson of bubbleLessons) {
        const levelId = bubbleLesson.level_id._id || bubbleLesson.level_id;
        const localLessons = await getLessonsByLevel(levelId);
        const localLesson = localLessons.find(l => l.id === bubbleLesson._id);

        if (!localLesson || this.needsUpdate(localLesson, bubbleLesson)) {
          await insertLessonFromBubble(bubbleLesson);
          logger.sync.itemSynced('Lesson', bubbleLesson.title);
        }
      }
    } catch (error) {
      logger.sync.error('Error syncing lessons from Bubble', { metadata: { error: String(error) } });
    }
  }

  // Sync quizzes from Bubble to local database
  async syncQuizzesFromBubble() {
    try {
      const bubbleQuizzes = await (bubbleApi.listQuizzes?.(this.lastSyncAt) || bubbleApi.syncQuizzes?.() || []);
      for (const bubbleQuiz of bubbleQuizzes) {
        const levelId = bubbleQuiz.lesson_id?._id || bubbleQuiz.lesson_id;
        if (!levelId) continue;
        await insertQuizFromBubble(bubbleQuiz);
        logger.sync.itemSynced('Quiz', bubbleQuiz.title);
      }
    } catch (error) {
      logger.sync.error('Error syncing quizzes from Bubble', { metadata: { error: String(error) } });
    }
  }

  // Check if local data needs update from Bubble
  needsUpdate(localItem, bubbleItem) {
    if (!localItem.updated_at || !bubbleItem.Modified_Date) {
      return true;
    }

    const localDate = new Date(localItem.updated_at);
    const bubbleDate = new Date(bubbleItem.Modified_Date);

    return bubbleDate > localDate;
  }

  // Periodic sync - run every 5 minutes when app is active
  startPeriodicSync(userId) {
    this.stopPeriodicSync(); // Clear any existing interval

    this.syncInterval = setInterval(async () => {
      await this.checkConnection();
      if (this.isOnline) {
        await this.syncFromBubble();
        if (userId) {
          // Pull latest user progress before pushing local changes
          await this.syncUserProgressFromBubble(userId);
        }
        if (userId) {
          await this.syncToBubble(userId);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Force sync - called when user pulls to refresh or on app start
  async forceSync(userId) {
    await this.checkConnection();
    if (this.isOnline) {
      await this.syncFromBubble();
      if (userId) {
        await this.syncUserProgressFromBubble(userId);
      }
      if (userId) {
        await this.syncToBubble(userId);
      }
    }
  }
}

// Default instance
export const syncService = new SyncService();