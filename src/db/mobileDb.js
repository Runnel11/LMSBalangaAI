// Mobile-specific database implementation using expo-sqlite
const SQLite = require('expo-sqlite');

let db = null;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('balangaai.db');
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        order_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        local_file_path TEXT,
        download_url TEXT,
        is_downloaded BOOLEAN DEFAULT 0,
        order_index INTEGER,
        estimated_duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (level_id) REFERENCES levels (id)
      );
      
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER,
        title TEXT NOT NULL,
        questions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
      );
      
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER,
        quiz_id INTEGER,
        is_completed BOOLEAN DEFAULT 0,
        score INTEGER,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
      );
      
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT,
        description TEXT,
        requirements TEXT,
        salary_range TEXT,
        location TEXT,
        required_level INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (required_level) REFERENCES levels (id)
      );
    `);
    
    await seedData();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

const seedData = async () => {
  try {
    const levelCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM levels');
    
    if (levelCount.count === 0) {
      await db.execAsync(`
        INSERT INTO levels (title, description, order_index) VALUES
        ('AI Fundamentals', 'Learn the basics of Artificial Intelligence and its applications', 1),
        ('AI Customer Service Specialist', 'Master AI tools for customer service excellence', 2),
        ('AI Operations Associate', 'Understand AI in business operations and workflow optimization', 3),
        ('AI Implementation Professional', 'Lead AI implementation projects and strategic planning', 4);
      `);
      
      await db.execAsync(`
        INSERT INTO lessons (level_id, title, description, content, download_url, order_index, estimated_duration) VALUES
        (1, 'Introduction to AI', 'Understanding what AI is and its impact on society', 'Artificial Intelligence (AI) represents one of the most transformative technologies of our time...', 'https://example.com/lessons/intro-ai.json', 1, 30),
        (1, 'Machine Learning Basics', 'Core concepts of machine learning and algorithms', 'Machine Learning is a subset of AI that enables computers to learn without being explicitly programmed...', 'https://example.com/lessons/ml-basics.json', 2, 45),
        
        (2, 'AI in Customer Support', 'How AI enhances customer service operations', 'Customer service has been revolutionized by AI technologies including chatbots, sentiment analysis...', 'https://example.com/lessons/ai-customer-support.json', 1, 35),
        (2, 'Chatbot Implementation', 'Building and deploying AI-powered chatbots', 'Learn to design, build, and deploy intelligent chatbots that can handle customer inquiries...', 'https://example.com/lessons/chatbot-implementation.json', 2, 50),
        
        (3, 'Process Automation', 'Using AI to automate business processes', 'Business process automation with AI can significantly improve efficiency and reduce costs...', 'https://example.com/lessons/process-automation.json', 1, 40),
        (3, 'Data Analysis with AI', 'Leveraging AI for business intelligence', 'AI-powered data analysis tools can uncover insights and patterns in business data...', 'https://example.com/lessons/data-analysis-ai.json', 2, 55),
        
        (4, 'AI Strategy Planning', 'Developing comprehensive AI implementation strategies', 'Creating successful AI strategies requires understanding business needs, technology capabilities...', 'https://example.com/lessons/ai-strategy.json', 1, 60),
        (4, 'Leading AI Projects', 'Managing and leading AI transformation initiatives', 'Learn to lead AI projects from conception to deployment, managing teams and stakeholders...', 'https://example.com/lessons/leading-ai-projects.json', 2, 65);
      `);
      
      await db.execAsync(`
        INSERT INTO quizzes (lesson_id, title, questions) VALUES
        (1, 'AI Fundamentals Quiz', '[{"question": "What does AI stand for?", "options": ["Artificial Intelligence", "Automated Intelligence", "Advanced Intelligence", "Applied Intelligence"], "correct": 0}, {"question": "Which of these is an AI application?", "options": ["Calculator", "Voice Assistant", "Word Processor", "Email Client"], "correct": 1}]'),
        (2, 'Machine Learning Quiz', '[{"question": "What is supervised learning?", "options": ["Learning without data", "Learning with labeled data", "Learning with unlabeled data", "Learning without algorithms"], "correct": 1}]'),
        (3, 'Customer Service AI Quiz', '[{"question": "What is the main benefit of AI chatbots?", "options": ["They never make mistakes", "24/7 availability", "They replace all humans", "They are free"], "correct": 1}]'),
        (4, 'Chatbot Implementation Quiz', '[{"question": "What is NLP in chatbots?", "options": ["Natural Language Processing", "Neural Language Programming", "Network Language Protocol", "New Language Parser"], "correct": 0}]');
      `);
      
      await db.execAsync(`
        INSERT INTO jobs (title, company, description, requirements, salary_range, location, required_level) VALUES
        ('AI Assistant Trainee', 'TechStart Inc', 'Entry-level position for AI enthusiasts', 'Completed AI Fundamentals course', '$35,000 - $45,000', 'Remote', 1),
        ('Customer Service AI Specialist', 'ServicePro Corp', 'Implement AI solutions in customer service', 'AI Customer Service Specialist certification', '$50,000 - $65,000', 'Manila, Philippines', 2),
        ('AI Operations Analyst', 'DataFlow Solutions', 'Optimize business operations using AI', 'AI Operations Associate certification', '$60,000 - $80,000', 'Makati, Philippines', 3),
        ('AI Implementation Manager', 'Innovation Labs', 'Lead AI transformation projects', 'AI Implementation Professional certification', '$85,000 - $120,000', 'BGC, Taguig', 4);
      `);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

export const getLevelById = async (levelId) => {
  try {
    return await db.getFirstAsync('SELECT * FROM levels WHERE id = ?', [levelId]);
  } catch (error) {
    console.error('Error getting level:', error);
    return null;
  }
};

export const getLessonsByLevel = async (levelId) => {
  try {
    return await db.getAllAsync(
      'SELECT * FROM lessons WHERE level_id = ? ORDER BY order_index',
      [levelId]
    );
  } catch (error) {
    console.error('Error getting lessons:', error);
    return [];
  }
};

export const getLessonById = async (lessonId) => {
  try {
    return await db.getFirstAsync('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  } catch (error) {
    console.error('Error getting lesson:', error);
    return null;
  }
};

export const getQuizByLessonId = async (lessonId) => {
  try {
    return await db.getFirstAsync('SELECT * FROM quizzes WHERE lesson_id = ?', [lessonId]);
  } catch (error) {
    console.error('Error getting quiz:', error);
    return null;
  }
};

export const getAllLevels = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM levels ORDER BY order_index');
  } catch (error) {
    console.error('Error getting levels:', error);
    return [];
  }
};

export const getProgress = async (lessonId = null, quizId = null) => {
  try {
    let query = 'SELECT * FROM user_progress WHERE 1=1';
    const params = [];
    
    if (lessonId) {
      query += ' AND lesson_id = ?';
      params.push(lessonId);
    }
    
    if (quizId) {
      query += ' AND quiz_id = ?';
      params.push(quizId);
    }
    
    return await db.getAllAsync(query, params);
  } catch (error) {
    console.error('Error getting progress:', error);
    return [];
  }
};

export const saveProgress = async (lessonId, quizId = null, score = null, isCompleted = true) => {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO user_progress 
       (lesson_id, quiz_id, is_completed, score, completed_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [lessonId, quizId, isCompleted ? 1 : 0, score]
    );
    console.log('Progress saved successfully');
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const updateLessonDownloadStatus = async (lessonId, localFilePath, isDownloaded = true) => {
  try {
    await db.runAsync(
      'UPDATE lessons SET local_file_path = ?, is_downloaded = ? WHERE id = ?',
      [localFilePath, isDownloaded ? 1 : 0, lessonId]
    );
    console.log('Lesson download status updated');
  } catch (error) {
    console.error('Error updating lesson download status:', error);
  }
};

export const getJobsByLevel = async (minLevel = 1) => {
  try {
    return await db.getAllAsync(
      'SELECT * FROM jobs WHERE required_level <= ? AND is_active = 1 ORDER BY required_level, created_at DESC',
      [minLevel]
    );
  } catch (error) {
    console.error('Error getting jobs:', error);
    return [];
  }
};

export const getCompletedLessonsCount = async () => {
  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(DISTINCT lesson_id) as count FROM user_progress WHERE is_completed = 1'
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting completed lessons count:', error);
    return 0;
  }
};

export const getLevelProgress = async (levelId) => {
  try {
    const totalLessons = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM lessons WHERE level_id = ?',
      [levelId]
    );
    
    const completedLessons = await db.getFirstAsync(
      `SELECT COUNT(DISTINCT l.id) as count 
       FROM lessons l 
       JOIN user_progress up ON l.id = up.lesson_id 
       WHERE l.level_id = ? AND up.is_completed = 1`,
      [levelId]
    );
    
    return {
      total: totalLessons?.count || 0,
      completed: completedLessons?.count || 0,
      percentage: totalLessons?.count > 0 ? Math.round((completedLessons?.count || 0) / totalLessons.count * 100) : 0
    };
  } catch (error) {
    console.error('Error getting level progress:', error);
    return { total: 0, completed: 0, percentage: 0 };
  }
};