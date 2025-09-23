import { Platform } from 'react-native';

// Platform-specific implementations
if (Platform.OS === 'web') {
  // Web implementation
  const webDownloadManager = require('./webDownloadManager');
  
  module.exports = {
    downloadLesson: webDownloadManager.downloadLesson,
    downloadAllLessonsInLevel: webDownloadManager.downloadAllLessonsInLevel,
    getLocalLessonContent: webDownloadManager.getLocalLessonContent,
    deleteLocalLesson: webDownloadManager.deleteLocalLesson,
    getDownloadedLessonsSize: webDownloadManager.getDownloadedLessonsSize,
    clearAllDownloads: webDownloadManager.clearAllDownloads,
    isNetworkAvailable: webDownloadManager.isNetworkAvailable,
  };
} else {
  // Mobile implementation
  const FileSystem = require('expo-file-system');
  const { updateLessonDownloadStatus, getLessonById, getLessonsByLevel, getAllLevels } = require('../db/index');
  const { logger } = require('../utils/logger');

  const DOWNLOAD_DIR = FileSystem.documentDirectory + 'lessons/';

  const ensureDownloadDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating download directory:', error);
    }
  };

  const downloadLesson = async (lesson, onProgress = null) => {
    try {
      await ensureDownloadDirectory();
      
      const fileName = `lesson_${lesson.id}.json`;
      const localPath = DOWNLOAD_DIR + fileName;
      
      if (!lesson.download_url) {
        const mockContent = {
          id: lesson.id,
          title: lesson.title,
          content: lesson.content || 'This is offline content for ' + lesson.title,
          duration: lesson.estimated_duration,
          downloadedAt: new Date().toISOString()
        };
        
        await FileSystem.writeAsStringAsync(localPath, JSON.stringify(mockContent, null, 2));
        await updateLessonDownloadStatus(lesson.id, localPath, true);
        if (__DEV__) logger.download.completed(String(lesson.id), (await FileSystem.getInfoAsync(localPath)).size || 0);
        
        return {
          success: true,
          localPath,
          message: 'Lesson downloaded successfully'
        };
      }
      
      const downloadResumable = FileSystem.createDownloadResumable(
        lesson.download_url,
        localPath,
        {},
        onProgress
      );
      
      const result = await downloadResumable.downloadAsync();
      
      if (result && result.status === 200) {
        await updateLessonDownloadStatus(lesson.id, localPath, true);
        if (__DEV__) logger.download.completed(String(lesson.id), result?.headers?._contentLength ? Number(result.headers._contentLength) : 0);
        return {
          success: true,
          localPath,
          message: 'Lesson downloaded successfully'
        };
      } else {
        throw new Error('Download failed with status: ' + result?.status);
      }
    } catch (error) {
      console.error('Error downloading lesson:', error);
      logger.download.failed(String(lesson?.id ?? ''), String(error?.message ?? error));
      return {
        success: false,
        error: error.message,
        message: 'Failed to download lesson'
      };
    }
  };

  const downloadAllLessonsInLevel = async (lessons, onProgress = null, onLessonComplete = null) => {
    const results = [];
    
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      
      if (lesson.is_downloaded) {
        results.push({
          lessonId: lesson.id,
          success: true,
          message: 'Already downloaded',
          skipped: true
        });
        continue;
      }
      
      const progressCallback = onProgress ? (progress) => {
        onProgress({
          lessonIndex: i,
          totalLessons: lessons.length,
          currentLessonProgress: progress,
          lesson: lesson
        });
      } : null;
      
      const result = await downloadLesson(lesson, progressCallback);
      results.push({
        lessonId: lesson.id,
        ...result
      });
      
      if (onLessonComplete) {
        onLessonComplete(lesson, result);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  };

  const getLocalLessonContent = async (lesson) => {
    try {
      if (!lesson.local_file_path || !lesson.is_downloaded) {
        return null;
      }
      
      const fileInfo = await FileSystem.getInfoAsync(lesson.local_file_path);
      if (!fileInfo.exists) {
        await updateLessonDownloadStatus(lesson.id, null, false);
        return null;
      }
      
      const content = await FileSystem.readAsStringAsync(lesson.local_file_path);
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading local lesson content:', error);
      return null;
    }
  };

  const deleteLocalLesson = async (lesson) => {
    try {
      if (!lesson.local_file_path) {
        return { success: true, message: 'No local file to delete' };
      }
      
      const fileInfo = await FileSystem.getInfoAsync(lesson.local_file_path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(lesson.local_file_path);
      }
      
      await updateLessonDownloadStatus(lesson.id, null, false);
      
      return { success: true, message: 'Lesson deleted successfully' };
    } catch (error) {
      console.error('Error deleting local lesson:', error);
      return { success: false, error: error.message };
    }
  };

  const getDownloadedLessonsSize = async () => {
    try {
      await ensureDownloadDirectory();
      const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = DOWNLOAD_DIR + file;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      }
      
      return {
        totalSize,
        fileCount: files.length,
        formattedSize: formatFileSize(totalSize)
      };
    } catch (error) {
      console.error('Error calculating downloaded lessons size:', error);
      return { totalSize: 0, fileCount: 0, formattedSize: '0 B' };
    }
  };

  const clearAllDownloads = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(DOWNLOAD_DIR);
        await ensureDownloadDirectory();
      }
      // Also reset DB flags for any downloaded lessons
      try {
        const levels = await getAllLevels();
        for (const lvl of levels) {
          const lessons = await getLessonsByLevel(String(lvl.id ?? lvl._id));
          for (const lesson of lessons) {
            if (lesson.is_downloaded) {
              await updateLessonDownloadStatus(lesson.id, null, false);
            }
          }
        }
      } catch (e) {
        logger.db.error('clear_all_downloads_reset_flags', String(e));
      }
      
      return { success: true, message: 'All downloads cleared successfully' };
    } catch (error) {
      console.error('Error clearing downloads:', error);
      return { success: false, error: error.message };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isNetworkAvailable = async () => {
    try {
      // Use the new networkService for better connectivity detection
      const { networkService } = require('./networkService');
      const status = await networkService.getNetworkStatus();
      return status.isConnected;
    } catch (error) {
      // Fallback to simple fetch test
      try {
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          timeout: 5000
        });
        return response.ok;
      } catch (fetchError) {
        return false;
      }
    }
  };

  // New helper APIs for offline features
  const isLessonDownloaded = async (lessonId) => {
    try {
      const lesson = await getLessonById(String(lessonId));
      return !!lesson?.is_downloaded;
    } catch {
      return false;
    }
  };

  const getOfflineLessons = async (levelId = null) => {
    const results = [];
    try {
      const addMeta = async (lesson) => {
        let size = 0;
        try {
          if (lesson.local_file_path) {
            const info = await FileSystem.getInfoAsync(lesson.local_file_path);
            size = info?.size || 0;
          }
        } catch {}
        results.push({ lessonId: lesson.id, title: lesson.title, totalSizeBytes: size, updatedAt: new Date().toISOString() });
      };

      if (levelId) {
        const lessons = await getLessonsByLevel(String(levelId));
        for (const l of lessons) if (l.is_downloaded) await addMeta(l);
      } else {
        const levels = await getAllLevels();
        for (const lvl of levels) {
          const lessons = await getLessonsByLevel(String(lvl.id ?? lvl._id));
          for (const l of lessons) if (l.is_downloaded) await addMeta(l);
        }
      }
    } catch (e) {
      logger.offline.syncError(String(e));
    }
    return results;
  };

  const getTotalOfflineSize = async () => {
    try {
      const meta = await getOfflineLessons(null);
      return meta.reduce((sum, m) => sum + (m.totalSizeBytes || 0), 0);
    } catch {
      return 0;
    }
  };

  const deleteLevelDownloads = async (levelId) => {
    try {
      const lessons = await getLessonsByLevel(String(levelId));
      for (const l of lessons) {
        if (l.is_downloaded) {
          await deleteLocalLesson(l);
        }
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  };

  module.exports = {
    downloadLesson,
    downloadAllLessonsInLevel,
    getLocalLessonContent,
    deleteLocalLesson,
    getDownloadedLessonsSize,
    clearAllDownloads,
    isNetworkAvailable,
    // new helpers
    isLessonDownloaded,
    getOfflineLessons,
    getTotalOfflineSize,
    deleteLevelDownloads,
  };
}