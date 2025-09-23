// Web-compatible download manager
import { getAllLevels, getLessonById, getLessonsByLevel, updateLessonDownloadStatus } from '../db/index';
import { logger } from '../utils/logger';

export const downloadLesson = async (lesson, onProgress = null) => {
  try {
    // Simulate download progress
    if (onProgress) {
      onProgress({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress({ totalBytesWritten: 100, totalBytesExpectedToWrite: 100 });
    }
    
    await updateLessonDownloadStatus(lesson.id, 'web_storage', true);
    
    return {
      success: true,
      localPath: 'web_storage',
      message: 'Lesson downloaded successfully'
    };
  } catch (error) {
    logger.download.failed(String(lesson?.id ?? ''), String(error?.message ?? error));
    return {
      success: false,
      error: error.message,
      message: 'Failed to download lesson'
    };
  }
};

export const downloadAllLessonsInLevel = async (lessons, onProgress = null, onLessonComplete = null) => {
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
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
};

export const getLocalLessonContent = async (lesson) => {
  try {
    if (lesson.is_downloaded) {
      return {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content || 'This is offline content for ' + lesson.title,
        duration: lesson.estimated_duration,
        downloadedAt: new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    logger.download.failed(String(lesson?.id ?? ''), String(error?.message ?? error));
    return null;
  }
};

export const deleteLocalLesson = async (lesson) => {
  try {
    await updateLessonDownloadStatus(lesson.id, null, false);
    return { success: true, message: 'Lesson deleted successfully' };
  } catch (error) {
    logger.download.failed(String(lesson?.id ?? ''), String(error?.message ?? error));
    return { success: false, error: error.message };
  }
};

export const getDownloadedLessonsSize = async () => {
  try {
    return {
      totalSize: 1024 * 1024, // 1MB simulation
      fileCount: 2,
      formattedSize: '1.0 MB'
    };
  } catch (error) {
    logger.download.failed('size_calc', String(error?.message ?? error));
    return { totalSize: 0, fileCount: 0, formattedSize: '0 B' };
  }
};

export const clearAllDownloads = async () => {
  try {
    console.log('Downloads cleared (web simulation)');
    return { success: true, message: 'All downloads cleared successfully' };
  } catch (error) {
    logger.download.failed('clear_all', String(error?.message ?? error));
    return { success: false, error: error.message };
  }
};

export const isNetworkAvailable = async () => {
  return true; // Always assume network is available on web
};

// Parity helper APIs without real FS metadata; sizes are approximated or 0
export const isLessonDownloaded = async (lessonId) => {
  try {
    const lesson = await getLessonById(String(lessonId));
    return !!lesson?.is_downloaded;
  } catch {
    return false;
  }
};

export const getOfflineLessons = async (levelId = null) => {
  const results = [];
  try {
    const addMeta = async (lesson) => {
      results.push({ lessonId: lesson.id, title: lesson.title, totalSizeBytes: 0, updatedAt: new Date().toISOString() });
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

export const getTotalOfflineSize = async () => {
  try {
    const meta = await getOfflineLessons(null);
    return meta.reduce((sum, m) => sum + (m.totalSizeBytes || 0), 0);
  } catch {
    return 0;
  }
};

export const deleteLevelDownloads = async (levelId) => {
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