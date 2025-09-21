// Web-compatible database implementation using localStorage
// Note: We no longer seed mock data. On first run, we fetch from Bubble if local cache is empty.
import { bubbleApi } from '../services/bubbleApi';

// Minimal state shape stored under a single key for compatibility
const STORAGE_KEY = 'balangaai_data';
const emptyState = { levels: [], lessons: [], progress: [], jobs: [], quizzes: [] };

// Initialize web storage
const initWebStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    }
  }
};

const getWebData = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { ...emptyState };
  }
  return { ...emptyState };
};

const setWebData = (data) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

// Helper: fetch from Bubble when local cache is empty
const fetchIfEmpty = async (key, fetcher) => {
  const data = getWebData();
  const items = Array.isArray(data[key]) ? data[key] : [];
  if (items.length > 0) return items;
  try {
    const remote = await fetcher();
    if (Array.isArray(remote) && remote.length > 0) {
      const updated = { ...data, [key]: remote };
      setWebData(updated);
      return remote;
    }
  } catch (err) {
    console.warn(`webDb: failed to fetch ${key} from Bubble`, err);
  }
  return items; // still empty
};

export const initDB = async () => {
  initWebStorage();
  console.log('Web database initialized');
};

// Keep the old export for compatibility
export const initWebDB = initDB;

export const getLevelById = async (levelId) => {
  const data = getWebData();
  let levels = data.levels;
  if (!levels || levels.length === 0) {
    levels = await fetchIfEmpty('levels', () => bubbleApi.listLevels());
  }
  return (levels || []).find(level => level.id === levelId) || null;
};

export const getLessonsByLevel = async (levelId) => {
  const data = getWebData();
  let lessons = data.lessons;
  if (!lessons || lessons.length === 0) {
    lessons = await fetchIfEmpty('lessons', () => bubbleApi.listLessons());
  }
  return (lessons || [])
    .filter(lesson => lesson.level_id === levelId)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
};

export const getLessonById = async (lessonId) => {
  const data = getWebData();
  let lessons = data.lessons;
  if (!lessons || lessons.length === 0) {
    lessons = await fetchIfEmpty('lessons', () => bubbleApi.listLessons());
  }
  return (lessons || []).find(lesson => lesson.id === lessonId) || null;
};

export const getQuizByLessonId = async (lessonId) => {
  // Try to source a real quiz from Bubble if available, cached under quizzes
  const data = getWebData();
  let quizzes = data.quizzes;
  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    quizzes = await fetchIfEmpty('quizzes', () => bubbleApi.listQuizzes?.());
  }
  const match = Array.isArray(quizzes)
    ? quizzes.find(q => q.lesson_id === lessonId || q.id === lessonId)
    : null;
  if (match) return match;

  // Fallback: lightweight generated quiz to avoid breaking the UI
  return {
    id: lessonId,
    lesson_id: lessonId,
    title: `Quiz for Lesson ${lessonId}`,
    questions: JSON.stringify([
      {
        question: 'What is the main benefit of AI in this context?',
        options: ['Cost reduction', 'Automation', 'Better insights', 'All of the above'],
        correct: 3,
      },
      {
        question: 'Which technology is most relevant here?',
        options: ['Machine Learning', 'Natural Language Processing', 'Computer Vision', 'Depends on use case'],
        correct: 3,
      },
    ]),
  };
};

export const getAllLevels = async () => {
  let levels = await fetchIfEmpty('levels', () => bubbleApi.listLevels());
  return (levels || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
};

export const getProgress = async (lessonId = null, quizId = null) => {
  const data = getWebData();
  let filteredProgress = data.progress;
  if (lessonId) {
    filteredProgress = filteredProgress.filter(p => p.lesson_id === lessonId);
  }
  if (quizId) {
    filteredProgress = filteredProgress.filter(p => p.quiz_id === quizId);
  }
  return filteredProgress;
};

export const saveProgress = async (lessonId, quizId = null, score = null, isCompleted = true) => {
  const data = getWebData();
  const existingIndex = data.progress.findIndex(p => 
    p.lesson_id === lessonId && (quizId ? p.quiz_id === quizId : !p.quiz_id)
  );
  
  const progressItem = {
    id: existingIndex >= 0 ? data.progress[existingIndex].id : data.progress.length + 1,
    lesson_id: lessonId,
    quiz_id: quizId,
    is_completed: isCompleted ? 1 : 0,
    score,
    completed_at: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    data.progress[existingIndex] = progressItem;
  } else {
    data.progress.push(progressItem);
  }
  
  setWebData(data);
  console.log('Progress saved successfully (web)');
};

export const updateLessonDownloadStatus = async (lessonId, localFilePath, isDownloaded = true) => {
  const data = getWebData();
  const lesson = data.lessons.find(l => l.id === lessonId);
  if (lesson) {
    lesson.local_file_path = localFilePath;
    lesson.is_downloaded = isDownloaded ? 1 : 0;
    setWebData(data);
  }
  console.log('Lesson download status updated (web)');
};

export const getJobsByLevel = async (minLevel = 1) => {
  let jobs = await fetchIfEmpty('jobs', () => bubbleApi.syncJobs?.() ?? []);
  return (jobs || [])
    .filter(job => job.required_level <= minLevel && job.is_active)
    .sort((a, b) => (a.required_level ?? 0) - (b.required_level ?? 0));
};

export const getCompletedLessonsCount = async () => {
  const data = getWebData();
  const completedLessons = new Set();
  data.progress.forEach(p => {
    if (p.is_completed === 1) {
      completedLessons.add(p.lesson_id);
    }
  });
  return completedLessons.size;
};

export const getLevelProgress = async (levelId) => {
  const data = getWebData();
  const levelLessons = data.lessons.filter(l => l.level_id === levelId);
  const completedLessonIds = new Set();
  
  data.progress.forEach(p => {
    if (p.is_completed === 1) {
      completedLessonIds.add(p.lesson_id);
    }
  });
  
  const completedCount = levelLessons.filter(l => completedLessonIds.has(l.id)).length;
  
  return {
    total: levelLessons.length,
    completed: completedCount,
    percentage: levelLessons.length > 0 ? Math.round((completedCount / levelLessons.length) * 100) : 0
  };
};