// This file exists to prevent mobileDb.js from being bundled on web
// The web platform should use webDb.js instead

export const initDB = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getLevelById = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getLessonsByLevel = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getLessonById = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getQuizByLessonId = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getAllLevels = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getProgress = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const saveProgress = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const updateLessonDownloadStatus = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getJobsByLevel = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getCompletedLessonsCount = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};

export const getLevelProgress = async () => {
  throw new Error('mobileDb should not be used on web platform. Use webDb instead.');
};