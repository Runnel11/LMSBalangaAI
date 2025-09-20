import {
    getAllLevels,
    getLessonsByLevel,
    getProgress,
    insertJobFromBubble,
    insertLessonFromBubble,
    insertLevelFromBubble,
    insertQuizFromBubble
} from '../db/index';
import { bubbleApi } from './bubbleApi';
import { networkService } from './networkService';

export class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
  }

  // Check network connectivity using the enhanced network service
  async checkConnection() {
    try {
      const status = await networkService.getNetworkStatus();
      this.isOnline = status.isConnected;
      return this.isOnline;
    } catch (error) {
      console.error('Error checking connection:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Sync data from Bubble to local database
  async syncFromBubble() {
    if (this.syncInProgress) {
      console.log('Sync skipped: already in progress');
      return;
    }

    // Check if we should sync on current connection type
    if (!networkService.isOnline) {
      console.log('Sync skipped: offline');
      return;
    }

    if (!networkService.hasReliableConnection() && !networkService.shouldSyncOnCellular()) {
      console.log('Sync skipped: not on reliable connection and cellular sync disabled');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync from Bubble...');

    try {
      await this.syncLevelsFromBubble();
      await this.syncLessonsFromBubble();
      console.log('Sync from Bubble completed successfully');
    } catch (error) {
      console.error('Sync from Bubble failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync user progress to Bubble
  async syncToBubble(userId) {
    if (!this.isOnline || !userId) {
      console.log('Cannot sync to Bubble: offline or no user');
      return;
    }

    try {
      const localProgress = await getProgress();

      for (const progress of localProgress) {
        await bubbleApi.syncUserProgress(userId, {
          lesson_id: progress.lesson_id,
          quiz_id: progress.quiz_id,
          is_completed: progress.is_completed,
          score: progress.score,
          completed_at: progress.completed_at
        });
      }

      console.log('User progress synced to Bubble');
    } catch (error) {
      console.error('Failed to sync progress to Bubble:', error);
    }
  }

  // Initial content loading for first-time app installation
  async initialContentLoad() {
    try {
      await this.checkConnection();
      if (!this.isOnline) {
        console.log('Cannot load initial content: offline');
        return false;
      }

      console.log('Loading initial content from Bubble...');

      // Load all content types in parallel
      const [levels, lessons, quizzes, jobs] = await Promise.all([
        bubbleApi.syncLevels(),
        bubbleApi.syncLessons(),
        bubbleApi.syncQuizzes ? bubbleApi.syncQuizzes() : [],
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

      console.log(`Initial content loaded: ${levels.length} levels, ${lessons.length} lessons, ${quizzes.length} quizzes, ${jobs.length} jobs`);
      return true;

    } catch (error) {
      console.error('Error loading initial content from Bubble:', error);
      return false;
    }
  }

  // Sync levels from Bubble to local database
  async syncLevelsFromBubble() {
    try {
      const bubbleLevels = await bubbleApi.syncLevels();
      const localLevels = await getAllLevels();

      // Compare and update levels if needed
      for (const bubbleLevel of bubbleLevels) {
        const localLevel = localLevels.find(l => l.id === bubbleLevel._id);

        if (!localLevel || this.needsUpdate(localLevel, bubbleLevel)) {
          await insertLevelFromBubble(bubbleLevel);
          console.log(`Level "${bubbleLevel.title}" synced from Bubble`);
        }
      }
    } catch (error) {
      console.error('Error syncing levels from Bubble:', error);
    }
  }

  // Sync lessons from Bubble to local database
  async syncLessonsFromBubble() {
    try {
      const bubbleLessons = await bubbleApi.syncLessons();

      // Group lessons by level and sync
      for (const bubbleLesson of bubbleLessons) {
        const levelId = bubbleLesson.level_id._id || bubbleLesson.level_id;
        const localLessons = await getLessonsByLevel(levelId);
        const localLesson = localLessons.find(l => l.id === bubbleLesson._id);

        if (!localLesson || this.needsUpdate(localLesson, bubbleLesson)) {
          await insertLessonFromBubble(bubbleLesson);
          console.log(`Lesson "${bubbleLesson.title}" synced from Bubble`);
        }
      }
    } catch (error) {
      console.error('Error syncing lessons from Bubble:', error);
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
        await this.syncToBubble(userId);
      }
    }
  }
}

// Default instance
export const syncService = new SyncService();