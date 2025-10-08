// Test Bubble data integrity - verify all foreign key relationships
const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-test/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchAll(endpoint) {
  const response = await fetch(`${BASE_URL}/obj/${endpoint}`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response?.results || [];
}

async function testDataIntegrity() {
  console.log('🔍 Testing Bubble Data Integrity');
  console.log('=================================\n');

  try {
    // Fetch all data
    const levels = await fetchAll('level');
    const lessons = await fetchAll('lesson');
    const quizzes = await fetchAll('quiz');

    console.log('📊 Data Summary:');
    console.log(`   Levels: ${levels.length}`);
    console.log(`   Lessons: ${lessons.length}`);
    console.log(`   Quizzes: ${quizzes.length}\n`);

    // Build level ID map
    const levelIds = new Set(levels.map(l => l._id));
    console.log('📁 Level IDs:');
    levels.forEach(l => console.log(`   - ${l._id}: "${l.title}"`));
    console.log('');

    // Check lesson relationships
    console.log('🔗 Checking Lesson → Level relationships:');
    let lessonIssues = [];
    lessons.forEach(lesson => {
      const levelId = lesson.level_id?._id || lesson.level_id;
      if (!levelId) {
        lessonIssues.push(`   ⚠️  Lesson "${lesson.title}" (${lesson._id}) has NO level_id`);
      } else if (!levelIds.has(levelId)) {
        lessonIssues.push(`   ❌ Lesson "${lesson.title}" references missing level: ${levelId}`);
      } else {
        console.log(`   ✅ Lesson "${lesson.title}" → Level ${levelId}`);
      }
    });

    if (lessonIssues.length > 0) {
      console.log('\n⚠️  Lesson Issues Found:');
      lessonIssues.forEach(issue => console.log(issue));
    }
    console.log('');

    // Build lesson ID map
    const lessonIds = new Set(lessons.map(l => l._id));

    // Check quiz relationships
    console.log('🔗 Checking Quiz → Lesson relationships:');
    let quizIssues = [];
    quizzes.forEach(quiz => {
      const lessonId = quiz.lesson_id?._id || quiz.lesson_id;
      if (!lessonId) {
        quizIssues.push(`   ⚠️  Quiz "${quiz.title}" (${quiz._id}) has NO lesson_id`);
      } else if (!lessonIds.has(lessonId)) {
        quizIssues.push(`   ❌ Quiz "${quiz.title}" references missing lesson: ${lessonId}`);
      } else {
        console.log(`   ✅ Quiz "${quiz.title}" → Lesson ${lessonId}`);
      }

      // Check for questions
      if (!quiz.questions || quiz.questions === '[]' || quiz.questions === '') {
        quizIssues.push(`   ⚠️  Quiz "${quiz.title}" has NO questions`);
      }
    });

    if (quizIssues.length > 0) {
      console.log('\n⚠️  Quiz Issues Found:');
      quizIssues.forEach(issue => console.log(issue));
    }
    console.log('');

    // Summary
    console.log('=================================');
    console.log('📈 Integrity Summary:');
    console.log(`   Total Issues: ${lessonIssues.length + quizIssues.length}`);

    if (lessonIssues.length === 0 && quizIssues.length === 0) {
      console.log('   ✅ All data relationships are valid!');
      console.log('   📱 Mobile app should work correctly with this data.');
    } else {
      console.log('   ❌ Data integrity issues found.');
      console.log('   🔧 Fix these issues in Bubble before syncing to mobile app.');
    }

    return lessonIssues.length === 0 && quizIssues.length === 0;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testDataIntegrity()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
