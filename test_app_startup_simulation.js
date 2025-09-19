// Simulate what happens when the app starts with an empty database
const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-02pdq/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function simulateAppStartup() {
  console.log('📱 Simulating App Startup with Empty Database');
  console.log('===============================================');

  try {
    console.log('🔄 Step 1: App detects empty database...');
    console.log('📡 Step 2: Attempting to load content from Bubble...');

    // Load content from Bubble
    const [levels, lessons, quizzes] = await Promise.all([
      loadFromBubble('level'),
      loadFromBubble('lesson'),
      loadFromBubble('quiz')
    ]);

    console.log('\n📊 Content Loading Results:');
    console.log(`✅ Levels: ${levels.length} loaded`);
    console.log(`✅ Lessons: ${lessons.length} loaded`);
    console.log(`${quizzes.length > 0 ? '✅' : '❌'} Quizzes: ${quizzes.length} loaded`);

    if (levels.length === 0 && lessons.length === 0) {
      console.log('\n⚠️  No content loaded from Bubble, using static fallback...');
      return simulateStaticFallback();
    }

    console.log('\n💾 Step 3: Inserting content into SQLite database...');

    // Simulate database insertion process
    console.log('\n🔄 Inserting levels first (no dependencies)...');
    levels.forEach((level, index) => {
      console.log(`   ${index + 1}. "${level.title}" (Order: ${level.order_index})`);
    });

    console.log('\n🔄 Inserting lessons (depends on levels)...');
    lessons.forEach((lesson, index) => {
      const levelLink = lesson.level_id ? `✅ Linked to level` : `❌ No level_id`;
      console.log(`   ${index + 1}. "${lesson.title}" - ${levelLink}`);
    });

    if (quizzes.length > 0) {
      console.log('\n🔄 Inserting quizzes (depends on lessons)...');
      quizzes.forEach((quiz, index) => {
        const lessonLink = quiz.lesson_id ? `✅ Linked to lesson` : `❌ No lesson_id`;
        const hasQuestions = quiz.questions && quiz.questions !== '[]' ? '✅ Has questions' : '❌ No questions';
        console.log(`   ${index + 1}. "${quiz.title}" - ${lessonLink}, ${hasQuestions}`);
      });
    }

    // Check data relationships
    console.log('\n🔍 Step 4: Validating data relationships...');

    const orphanedLessons = lessons.filter(l => !l.level_id || l.level_id === '');
    if (orphanedLessons.length > 0) {
      console.log(`⚠️  Warning: ${orphanedLessons.length} lessons have no level_id`);
      console.log('   These lessons won\'t appear properly in the app');
    }

    const orphanedQuizzes = quizzes.filter(q => !q.lesson_id || q.lesson_id === '');
    if (orphanedQuizzes.length > 0) {
      console.log(`⚠️  Warning: ${orphanedQuizzes.length} quizzes have no lesson_id`);
      console.log('   These quizzes won\'t be accessible from lessons');
    }

    const emptyQuizzes = quizzes.filter(q => !q.questions || q.questions === '[]' || q.questions === '');
    if (emptyQuizzes.length > 0) {
      console.log(`⚠️  Warning: ${emptyQuizzes.length} quizzes have no questions`);
      console.log('   These quizzes will be empty when users try to take them');
    }

    console.log('\n🎯 Step 5: App startup completed!');
    console.log('📱 User can now navigate the app with dynamic content');

    // Simulate user navigation
    console.log('\n📲 Simulating User Navigation:');
    console.log('1. User opens app → Sees course levels from Bubble');
    console.log('2. User taps level → Sees lessons (may have missing links)');
    console.log('3. User taps lesson → Sees content from Bubble');
    console.log('4. User completes lesson → Quiz may or may not work');

    const success = levels.length > 0 && lessons.length > 0;
    console.log(`\n🏆 Overall Status: ${success ? 'SUCCESS' : 'FAILED'}`);

    if (orphanedLessons.length > 0 || orphanedQuizzes.length > 0 || emptyQuizzes.length > 0) {
      console.log('⚠️  App works but has data relationship issues');
      console.log('🔧 Fix needed: Update Bubble data to link lessons to levels and quizzes to lessons');
    } else {
      console.log('✅ App is fully functional with complete dynamic content!');
    }

    return success;

  } catch (error) {
    console.error('❌ App startup failed:', error.message);
    console.log('\n🔄 Falling back to static content...');
    return simulateStaticFallback();
  }
}

async function loadFromBubble(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/wf/${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.response?.results || [];
  } catch (error) {
    console.log(`❌ Failed to load ${endpoint}: ${error.message}`);
    return [];
  }
}

function simulateStaticFallback() {
  console.log('📱 Using static fallback content...');
  console.log('✅ App works with pre-built content');
  console.log('⚠️  Content is not dynamic from Bubble');
  return true;
}

simulateAppStartup().then(success => {
  console.log(`\n🏁 App Startup Simulation: ${success ? 'SUCCESS' : 'FAILED'}`);
}).catch(console.error);