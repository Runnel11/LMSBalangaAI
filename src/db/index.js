import { Platform } from 'react-native';

// Dynamic import with error handling to avoid bundling issues
let dbModule = null;

const initializeDBModule = async () => {
  if (dbModule) return dbModule;
  
  try {
    if (Platform.OS === 'web') {
      // Import web implementation
      dbModule = await import('./webDb.js');
    } else {
      // Import mobile implementation
      dbModule = await import('./mobileDb.js');
    }
    return dbModule;
  } catch (error) {
    console.error('Error importing database module:', error);
    // Fallback to web implementation
    dbModule = await import('./webDb.js');
    return dbModule;
  }
};

// Wrapper functions that dynamically import the appropriate module
export const initDB = async () => {
  const db = await initializeDBModule();
  return db.initDB();
};

export const getLevelById = async (levelId) => {
  const db = await initializeDBModule();
  return db.getLevelById(levelId);
};

export const getLessonsByLevel = async (levelId) => {
  const db = await initializeDBModule();
  return db.getLessonsByLevel(levelId);
};

export const getLessonById = async (lessonId) => {
  const db = await initializeDBModule();
  return db.getLessonById(lessonId);
};

export const getQuizByLessonId = async (lessonId) => {
  const db = await initializeDBModule();
  return db.getQuizByLessonId(lessonId);
};

export const getAllLevels = async () => {
  const db = await initializeDBModule();
  return db.getAllLevels();
};

export const getProgress = async (lessonId = null, quizId = null) => {
  const db = await initializeDBModule();
  return db.getProgress(lessonId, quizId);
};

export const saveProgress = async (lessonId, quizId = null, score = null, isCompleted = true) => {
  const db = await initializeDBModule();
  return db.saveProgress(lessonId, quizId, score, isCompleted);
};

export const updateLessonDownloadStatus = async (lessonId, localFilePath, isDownloaded = true) => {
  const db = await initializeDBModule();
  return db.updateLessonDownloadStatus(lessonId, localFilePath, isDownloaded);
};

export const getJobsByLevel = async (minLevel = 1) => {
  const db = await initializeDBModule();
  return db.getJobsByLevel(minLevel);
};

export const getCompletedLessonsCount = async () => {
  const db = await initializeDBModule();
  return db.getCompletedLessonsCount();
};

export const getLevelProgress = async (levelId) => {
  const db = await initializeDBModule();
  return db.getLevelProgress(levelId);
};