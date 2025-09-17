// Web-compatible database implementation using localStorage
import { Platform } from 'react-native';

// Mock data for web platform
const mockData = {
  levels: [
    { id: 1, title: 'AI Fundamentals', description: 'Learn the basics of Artificial Intelligence and its applications', order_index: 1 },
    { id: 2, title: 'AI Customer Service Specialist', description: 'Master AI tools for customer service excellence', order_index: 2 },
    { id: 3, title: 'AI Operations Associate', description: 'Understand AI in business operations and workflow optimization', order_index: 3 },
    { id: 4, title: 'AI Implementation Professional', description: 'Lead AI implementation projects and strategic planning', order_index: 4 }
  ],
  lessons: [
    { id: 1, level_id: 1, title: 'Introduction to AI', description: 'Understanding what AI is and its impact on society', content: 'Artificial Intelligence (AI) represents one of the most transformative technologies of our time. From virtual assistants to autonomous vehicles, AI is reshaping how we live and work.', order_index: 1, estimated_duration: 30, is_downloaded: 0, local_file_path: null },
    { id: 2, level_id: 1, title: 'Machine Learning Basics', description: 'Core concepts of machine learning and algorithms', content: 'Machine Learning is a subset of AI that enables computers to learn without being explicitly programmed. It uses algorithms to find patterns in data and make predictions.', order_index: 2, estimated_duration: 45, is_downloaded: 0, local_file_path: null },
    { id: 3, level_id: 2, title: 'AI in Customer Support', description: 'How AI enhances customer service operations', content: 'Customer service has been revolutionized by AI technologies including chatbots, sentiment analysis, and automated ticket routing.', order_index: 1, estimated_duration: 35, is_downloaded: 0, local_file_path: null },
    { id: 4, level_id: 2, title: 'Chatbot Implementation', description: 'Building and deploying AI-powered chatbots', content: 'Learn to design, build, and deploy intelligent chatbots that can handle customer inquiries with natural language processing.', order_index: 2, estimated_duration: 50, is_downloaded: 0, local_file_path: null },
    { id: 5, level_id: 3, title: 'Process Automation', description: 'Using AI to automate business processes', content: 'Business process automation with AI can significantly improve efficiency and reduce costs through intelligent workflow management.', order_index: 1, estimated_duration: 40, is_downloaded: 0, local_file_path: null },
    { id: 6, level_id: 3, title: 'Data Analysis with AI', description: 'Leveraging AI for business intelligence', content: 'AI-powered data analysis tools can uncover insights and patterns in business data to drive strategic decisions.', order_index: 2, estimated_duration: 55, is_downloaded: 0, local_file_path: null },
    { id: 7, level_id: 4, title: 'AI Strategy Planning', description: 'Developing comprehensive AI implementation strategies', content: 'Creating successful AI strategies requires understanding business needs, technology capabilities, and organizational readiness.', order_index: 1, estimated_duration: 60, is_downloaded: 0, local_file_path: null },
    { id: 8, level_id: 4, title: 'Leading AI Projects', description: 'Managing and leading AI transformation initiatives', content: 'Learn to lead AI projects from conception to deployment, managing teams and stakeholders throughout the transformation.', order_index: 2, estimated_duration: 65, is_downloaded: 0, local_file_path: null }
  ],
  progress: [],
  jobs: [
    { id: 1, title: 'AI Assistant Trainee', company: 'TechStart Inc', description: 'Entry-level position for AI enthusiasts', requirements: 'Completed AI Fundamentals course', salary_range: '$35,000 - $45,000', location: 'Remote', required_level: 1, is_active: true },
    { id: 2, title: 'Customer Service AI Specialist', company: 'ServicePro Corp', description: 'Implement AI solutions in customer service', requirements: 'AI Customer Service Specialist certification', salary_range: '$50,000 - $65,000', location: 'Manila, Philippines', required_level: 2, is_active: true },
    { id: 3, title: 'AI Operations Analyst', company: 'DataFlow Solutions', description: 'Optimize business operations using AI', requirements: 'AI Operations Associate certification', salary_range: '$60,000 - $80,000', location: 'Makati, Philippines', required_level: 3, is_active: true },
    { id: 4, title: 'AI Implementation Manager', company: 'Innovation Labs', description: 'Lead AI transformation projects', requirements: 'AI Implementation Professional certification', salary_range: '$85,000 - $120,000', location: 'BGC, Taguig', required_level: 4, is_active: true }
  ]
};

// Initialize web storage
const initWebStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('balangaai_data');
    if (!stored) {
      localStorage.setItem('balangaai_data', JSON.stringify(mockData));
    }
  }
};

const getWebData = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('balangaai_data');
    return stored ? JSON.parse(stored) : mockData;
  }
  return mockData;
};

const setWebData = (data) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('balangaai_data', JSON.stringify(data));
  }
};

export const initDB = async () => {
  initWebStorage();
  console.log('Web database initialized');
};

// Keep the old export for compatibility
export const initWebDB = initDB;

export const getLevelById = async (levelId) => {
  const data = getWebData();
  return data.levels.find(level => level.id === levelId) || null;
};

export const getLessonsByLevel = async (levelId) => {
  const data = getWebData();
  return data.lessons.filter(lesson => lesson.level_id === levelId)
    .sort((a, b) => a.order_index - b.order_index);
};

export const getLessonById = async (lessonId) => {
  const data = getWebData();
  return data.lessons.find(lesson => lesson.id === lessonId) || null;
};

export const getQuizByLessonId = async (lessonId) => {
  return {
    id: lessonId,
    lesson_id: lessonId,
    title: `Quiz for Lesson ${lessonId}`,
    questions: JSON.stringify([
      {
        question: "What is the main benefit of AI in this context?",
        options: ["Cost reduction", "Automation", "Better insights", "All of the above"],
        correct: 3
      },
      {
        question: "Which technology is most relevant here?",
        options: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Depends on use case"],
        correct: 3
      }
    ])
  };
};

export const getAllLevels = async () => {
  const data = getWebData();
  return data.levels.sort((a, b) => a.order_index - b.order_index);
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
  const data = getWebData();
  return data.jobs.filter(job => job.required_level <= minLevel && job.is_active)
    .sort((a, b) => a.required_level - b.required_level);
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