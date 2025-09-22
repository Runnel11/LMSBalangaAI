// Quick script to test getQuizByLessonId path
const { bubbleApi } = require('../src/services/bubbleApi');
const webDb = require('../src/db/webDb.js');

(async () => {
  try {
    // Fetch all quizzes to get a valid lesson ID
    const quizzes = await bubbleApi.listQuizzes();
    console.log(`Found ${quizzes.length} quizzes via Data API`);
    if (quizzes.length === 0) return;
    const lessonId = quizzes[0].lesson || quizzes[0].lesson_id || quizzes[0]._id;
    console.log('Using lessonId:', lessonId);
    const quiz = await webDb.getQuizByLessonId(lessonId);
    console.log('webDb.getQuizByLessonId result:', quiz);
  } catch (e) {
    console.error('Quick quiz check failed:', e);
  }
})();