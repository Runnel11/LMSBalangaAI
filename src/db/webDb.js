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

// ---------- Normalizers: Convert Bubble shapes to app-consumed shapes ----------
const normalizeLevels = (items = []) =>
  (items || []).map((it) => ({
    ...it,
    id: it.id ?? it._id ?? it.Id ?? it.ID,
    title: it.title ?? it.name ?? it.Title,
    description: it.description ?? it.Description ?? '',
    order_index: it.order_index ?? it.order ?? 0,
  }));

const normalizeLessons = (items = []) =>
  (items || []).map((it) => ({
    ...it,
    id: it.id ?? it._id ?? it.Id ?? it.ID,
    level_id: it.level_id ?? it.level ?? it.levelId ?? it.LevelId ?? null,
    title: it.title ?? '',
    description: it.description ?? '',
    content: it.content ?? it.body ?? '',
    order_index: it.order_index ?? it.order ?? 0,
    estimated_duration: it.estimated_duration ?? it.duration ?? 0,
    is_downloaded: it.is_downloaded ?? 0,
    local_file_path: it.local_file_path ?? null,
  }));

const normalizeQuizzes = (items = []) =>
  (items || []).map((it) => {
    const id = it.id ?? it._id ?? it.Id ?? it.ID;
    const lesson_id = it.lesson_id ?? it.lesson ?? it.lessonId ?? null;
    // Preserve questions as-is; we'll resolve later if they are IDs
    let questions;
    if (Array.isArray(it.questions)) {
      questions = JSON.stringify(it.questions);
    } else if (typeof it.questions === 'string') {
      questions = it.questions;
    } else {
      questions = '[]';
    }
    return { ...it, id, lesson_id, questions };
  });

const normalizeJobs = (items = []) =>
  (items || []).map((it) => {
    const id = it.id ?? it._id ?? it.Id ?? it.ID;
    const raw = it.required_level ?? it.min_level ?? null;
    let required_level = null; // numeric if known
    let required_level_ref = null; // Bubble id if reference
    if (raw != null) {
      if (typeof raw === 'object') {
        required_level_ref = raw._id ?? raw.id ?? null;
      } else if (typeof raw === 'string') {
        const n = Number(raw);
        if (Number.isFinite(n)) required_level = n; else required_level_ref = raw;
      } else if (typeof raw === 'number') {
        required_level = raw;
      }
    }
    const is_active = typeof it.is_active === 'boolean' ? it.is_active : String(it.is_active).toLowerCase() !== 'false';
    return {
      ...it,
      id,
      required_level,
      required_level_ref,
      is_active,
    };
  });

// Ensure cached arrays are normalized; if not, normalize and persist
const ensureNormalized = (data, key) => {
  const arr = Array.isArray(data[key]) ? data[key] : [];
  if (arr.length === 0) return data;
  const needsLevelFix = key === 'levels' && arr.some((x) => x && x.id == null && x._id != null);
  const needsLessonFix = key === 'lessons' && arr.some((x) => (x && (x.id == null && x._id != null)) || (x && x.level_id == null && x.level != null));
  const needsQuizFix = key === 'quizzes' && arr.some((x) => (x && (x.id == null && x._id != null)) || (x && x.lesson_id == null && x.lesson != null));
  const needsJobFix = key === 'jobs' && arr.some((x) => x && x.id == null && x._id != null);

  let normalized = arr;
  if (key === 'levels' && needsLevelFix) normalized = normalizeLevels(arr);
  if (key === 'lessons' && needsLessonFix) normalized = normalizeLessons(arr);
  if (key === 'quizzes' && needsQuizFix) normalized = normalizeQuizzes(arr);
  if (key === 'jobs' && needsJobFix) normalized = normalizeJobs(arr);

  if (normalized !== arr) {
    const updated = { ...data, [key]: normalized };
    setWebData(updated);
    return updated;
  }
  return data;
};

// Helper: fetch from Bubble when local cache is empty
const fetchIfEmpty = async (key, fetcher, normalizer) => {
  let data = getWebData();
  data = ensureNormalized(data, key);
  let items = Array.isArray(data[key]) ? data[key] : [];
  if (items.length > 0) return items;
  try {
    const remote = await fetcher();
    const normalized = typeof normalizer === 'function' ? normalizer(remote) : remote;
    if (Array.isArray(normalized) && normalized.length > 0) {
      const updated = { ...data, [key]: normalized };
      setWebData(updated);
      return normalized;
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
  let data = getWebData();
  data = ensureNormalized(data, 'levels');
  let levels = data.levels;
  if (!levels || levels.length === 0) {
    levels = await fetchIfEmpty('levels', () => bubbleApi.listLevels(), normalizeLevels);
  }
  return (levels || []).find(level => String(level.id) === String(levelId)) || null;
};

export const getLessonsByLevel = async (levelId) => {
  let data = getWebData();
  data = ensureNormalized(data, 'lessons');
  let lessons = data.lessons;
  if (!lessons || lessons.length === 0) {
    lessons = await fetchIfEmpty('lessons', () => bubbleApi.listLessons(), normalizeLessons);
  }
  return (lessons || [])
    .filter(lesson => String(lesson.level_id) === String(levelId))
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
};

export const getLessonById = async (lessonId) => {
  let data = getWebData();
  data = ensureNormalized(data, 'lessons');
  let lessons = data.lessons;
  if (!lessons || lessons.length === 0) {
    lessons = await fetchIfEmpty('lessons', () => bubbleApi.listLessons(), normalizeLessons);
  }
  return (lessons || []).find(lesson => String(lesson.id) === String(lessonId)) || null;
};

export const getQuizByLessonId = async (lessonId) => {
  // Try to source a real quiz from Bubble if available, cached under quizzes
  let data = getWebData();
  data = ensureNormalized(data, 'quizzes');
  let quizzes = data.quizzes;
  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    quizzes = await fetchIfEmpty('quizzes', () => bubbleApi.listQuizzes?.(), normalizeQuizzes);
  }
  const match = Array.isArray(quizzes)
    ? quizzes.find(q => String(q.lesson_id) === String(lessonId) || String(q.id) === String(lessonId))
    : null;
  if (match) {
    // If questions are an array of IDs, resolve them to full question objects once
    try {
      const parsed = typeof match.questions === 'string' ? JSON.parse(match.questions) : match.questions;
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // Resolve each ID via Data API
        const resolved = [];
        for (const qid of parsed) {
          try {
            const q = await bubbleApi.getObjectById('question', qid);
            // Normalize to UI shape
            resolved.push({
              question: q.question || '',
              options: Array.isArray(q.options) ? q.options.map((o) => String(o).replace(/^"|"$/g, '')) : [],
              correct: typeof q.correct === 'number' ? q.correct : 0,
            });
          } catch (e) {
            // Skip if cannot resolve
          }
        }
        if (resolved.length > 0) {
          const updated = { ...match, questions: JSON.stringify(resolved) };
          // Persist back to cache so future loads are fast
          const fresh = getWebData();
          const idx = (fresh.quizzes || []).findIndex(q => String(q.id) === String(match.id));
          if (idx >= 0) {
            fresh.quizzes[idx] = updated;
            setWebData(fresh);
          }
          return updated;
        }
      }
    } catch {}
    return match;
  }

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
  let data = getWebData();
  data = ensureNormalized(data, 'levels');
  let levels = data.levels;
  if (!levels || levels.length === 0) {
    levels = await fetchIfEmpty('levels', () => bubbleApi.listLevels(), normalizeLevels);
  }
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
  const data = ensureNormalized(getWebData(), 'lessons');
  const lesson = data.lessons.find(l => String(l.id) === String(lessonId));
  if (lesson) {
    lesson.local_file_path = localFilePath;
    lesson.is_downloaded = isDownloaded ? 1 : 0;
    setWebData(data);
  }
  console.log('Lesson download status updated (web)');
};

export const getJobsByLevel = async (minLevel = 1) => {
  let data = getWebData();
  // Ensure levels are available for mapping references → order_index
  data = ensureNormalized(data, 'levels');
  let levels = data.levels;
  if (!levels || levels.length === 0) {
    levels = await fetchIfEmpty('levels', () => bubbleApi.listLevels(), normalizeLevels);
    // refresh local snapshot after potential set
    data = getWebData();
  }

  // Load jobs
  data = ensureNormalized(data, 'jobs');
  let jobs = data.jobs;
  const needsRefresh = Array.isArray(jobs) && jobs.length > 0 && !jobs.some(j => Object.prototype.hasOwnProperty.call(j, 'required_level_ref'));
  if (!jobs || jobs.length === 0 || needsRefresh) {
    try {
      const remote = await (bubbleApi.listJobs?.() || bubbleApi.syncJobs?.() || Promise.resolve([]));
      const normalized = normalizeJobs(remote);
      const updated = { ...getWebData(), jobs: normalized };
      setWebData(updated);
      jobs = normalized;
    } catch (e) {
      console.warn('webDb: failed to refresh jobs, falling back to cache', e);
      if (!jobs) jobs = [];
    }
  }

  // Build mapping: level id (string) → order_index (numeric 1..N)
  let sortedLevels = (levels || []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  let idToOrder = new Map();
  const buildMap = () => {
    idToOrder = new Map();
    sortedLevels.forEach((lvl, idx) => {
      const key = String(lvl.id ?? lvl._id);
      const order = lvl.order_index ?? idx + 1;
      idToOrder.set(key, order);
    });
  };
  buildMap();

  // If we have jobs that reference level IDs not present in our map (legacy cache), refresh levels once
  const missingRef = (jobs || []).some(j => j.required_level_ref && !idToOrder.has(String(j.required_level_ref)));
  if (missingRef) {
    try {
      const remoteLvls = await bubbleApi.listLevels?.();
      if (Array.isArray(remoteLvls) && remoteLvls.length) {
        const normalizedLvls = normalizeLevels(remoteLvls);
        const updated = { ...getWebData(), levels: normalizedLvls };
        setWebData(updated);
        sortedLevels = normalizedLvls.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        buildMap();
      }
    } catch (e) {
      console.warn('webDb: failed to refresh levels for job mapping', e);
    }
  }

  // Ensure each job has a numeric required_level using either numeric value or referenced level order_index
  const jobsWithNumeric = (jobs || []).map((job) => {
    // Important: Number(null) === 0, so handle nullish explicitly
    let rl = (typeof job.required_level === 'number' && Number.isFinite(job.required_level))
      ? job.required_level
      : NaN;
    if (!Number.isFinite(rl)) {
      const ref = job.required_level_ref || job.required_level; // try both
      if (ref != null) {
        const mapped = idToOrder.get(String(ref));
        if (Number.isFinite(mapped)) rl = mapped;
      }
    }
    // Clamp to at least 1
    if (!Number.isFinite(rl) || rl <= 0) rl = 1;
    return { ...job, required_level: rl };
  });

  // Persist corrected numeric levels back to cache
  try {
    const updatedData = { ...getWebData(), jobs: jobsWithNumeric };
    setWebData(updatedData);
  } catch {}

  const userMin = Number(minLevel) || 1;
  return jobsWithNumeric
    .filter(job => Number(job.required_level) <= userMin && job.is_active)
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