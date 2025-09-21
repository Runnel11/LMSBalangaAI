import { Platform } from 'react-native';

// Dynamic import with error handling to avoid bundling issues
let dbModule = null;
let currentUserId = null; // tracked user for mobile DBs

export const setCurrentUserId = (userId) => {
  currentUserId = userId ?? null;
};

// Getter to retrieve the current scoped userId for DB operations
export const getCurrentUserId = () => currentUserId;

const initializeDBModule = async () => {
  if (dbModule) return dbModule;
  
  try {
    if (Platform.OS === 'web') {
      // Import web implementation
      dbModule = await import('./webDb');
    } else {
      // Import mobile implementation
      dbModule = await import('./mobileDb');
    }
    return dbModule;
  } catch (error) {
    console.error('Error importing database module:', error);
    // Fallback to web implementation
    dbModule = await import('./webDb');
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
  if (Platform.OS === 'web') {
    return db.getProgress(lessonId, quizId);
  }
  // Mobile DB expects userId first
  const uid = currentUserId ?? 1; // default to 1 for local anonymous user
  return db.getProgress(uid, lessonId, quizId);
};

export const saveProgress = async (lessonId, quizId = null, score = null, isCompleted = true) => {
  const db = await initializeDBModule();
  if (Platform.OS === 'web') {
    return db.saveProgress(lessonId, quizId, score, isCompleted);
  }
  const uid = currentUserId ?? 1;
  return db.saveProgress(uid, lessonId, quizId, score, isCompleted);
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
  if (Platform.OS === 'web') {
    return db.getCompletedLessonsCount();
  }
  const uid = currentUserId ?? 1;
  return db.getCompletedLessonsCount(uid);
};

export const getLevelProgress = async (levelId) => {
  const db = await initializeDBModule();
  if (Platform.OS === 'web') {
    return db.getLevelProgress(levelId);
  }
  const uid = currentUserId ?? 1;
  return db.getLevelProgress(uid, levelId);
};

export const createUser = async (email, passwordHash, firstName, lastName) => {
  const db = await initializeDBModule();
  return db.createUser(email, passwordHash, firstName, lastName);
};

export const getUserByEmail = async (email) => {
  const db = await initializeDBModule();
  return db.getUserByEmail(email);
};

export const getUserById = async (userId) => {
  const db = await initializeDBModule();
  return db.getUserById(userId);
};

// Repair legacy progress rows where user/lesson were swapped (mobile only)
export const repairProgressData = async () => {
  const db = await initializeDBModule();
  if (Platform.OS === 'web' || typeof db.repairProgressData !== 'function') {
    return { updated: 0 };
  }
  try {
    const uid = currentUserId ?? 1;
    return await db.repairProgressData(uid);
  } catch (error) {
    console.error('Error repairing progress data:', error);
    return { updated: 0 };
  }
};