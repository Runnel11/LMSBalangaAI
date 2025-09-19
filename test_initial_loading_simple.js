// Test script to simulate initial content loading from Bubble
const API_KEY = process.env.EXPO_PUBLIC_BUBBLE_API_KEY || '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-02pdq/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function loadContent(endpoint, name) {
  try {
    console.log(`📡 Loading ${name}...`);
    const response = await fetch(`${BASE_URL}/wf/${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.response?.results || [];
    console.log(`✅ ${name}: ${results.length} records`);
    return results;
  } catch (error) {
    console.log(`❌ ${name} error: ${error.message}`);
    return [];
  }
}

async function testInitialContentLoading() {
  console.log('🚀 Testing Initial Content Loading from Bubble');
  console.log('===============================================');

  try {
    // Test network connectivity
    console.log('📡 Step 1: Checking network connectivity...');
    const testResponse = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD'
    });
    console.log(`✅ Network: ${testResponse.ok ? 'Online' : 'Offline'}`);

    if (!testResponse.ok) {
      console.log('❌ Cannot proceed - no internet connection');
      return false;
    }

    // Load all content types
    console.log('\n📋 Step 2: Loading content from Bubble API...');
    const startTime = Date.now();

    const [levels, lessons, quizzes] = await Promise.all([
      loadContent('level', 'Levels'),
      loadContent('lesson', 'Lessons'),
      loadContent('quiz', 'Quizzes')
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Total load time: ${loadTime}ms`);

    // Validate loaded content
    console.log('\n📊 Step 3: Validating loaded content...');

    if (levels.length > 0) {
      console.log(`📁 Sample level data:`);
      console.log(`   Title: "${levels[0].title}"`);
      console.log(`   ID: ${levels[0]._id}`);
      console.log(`   Order: ${levels[0].order_index}`);
    }

    if (lessons.length > 0) {
      console.log(`📚 Sample lesson data:`);
      console.log(`   Title: "${lessons[0].title}"`);
      console.log(`   Level ID: ${lessons[0].level_id || 'MISSING'}`);
      console.log(`   Duration: ${lessons[0].estimated_duration}min`);
    }

    if (quizzes.length > 0) {
      console.log(`❓ Sample quiz data:`);
      console.log(`   Title: "${quizzes[0].title}"`);
      console.log(`   Lesson ID: ${quizzes[0].lesson_id || 'MISSING'}`);
      console.log(`   Questions: ${quizzes[0].questions || 'EMPTY'}`);
    }

    // Check for data issues
    console.log('\n🔍 Step 4: Checking data integrity...');
    let issues = [];

    if (lessons.length > 0) {
      const lessonsWithoutLevel = lessons.filter(l => !l.level_id || l.level_id === '');
      if (lessonsWithoutLevel.length > 0) {
        issues.push(`${lessonsWithoutLevel.length} lessons missing level_id`);
      }
    }

    if (quizzes.length > 0) {
      const quizzesWithoutLesson = quizzes.filter(q => !q.lesson_id || q.lesson_id === '');
      if (quizzesWithoutLesson.length > 0) {
        issues.push(`${quizzesWithoutLesson.length} quizzes missing lesson_id`);
      }

      const quizzesWithoutQuestions = quizzes.filter(q => !q.questions || q.questions === '[]' || q.questions === '');
      if (quizzesWithoutQuestions.length > 0) {
        issues.push(`${quizzesWithoutQuestions.length} quizzes have no questions`);
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Data issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ No data integrity issues found');
    }

    // Simulate what would happen in the app
    console.log('\n💾 Step 5: Simulating app database insertion...');
    console.log('   This simulates what initialContentLoad() would do:');

    // Simulate insertion order (levels first, then lessons, then quizzes)
    console.log(`   1. Insert ${levels.length} levels into SQLite`);
    console.log(`   2. Insert ${lessons.length} lessons into SQLite`);
    console.log(`   3. Insert ${quizzes.length} quizzes into SQLite`);

    // Summary
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Content loaded: ${levels.length} levels, ${lessons.length} lessons, ${quizzes.length} quizzes`);
    console.log(`⏱️  Load time: ${loadTime}ms`);
    console.log(`⚠️  Issues: ${issues.length}`);

    const success = levels.length > 0 && lessons.length > 0;
    console.log(`🎯 Overall: ${success ? 'SUCCESS - App can load content from Bubble!' : 'PARTIAL/FAILED'}`);

    if (success) {
      console.log('\n🎉 Your app is ready to use dynamic content from Bubble!');
      console.log('Next time the app starts with empty database, it will:');
      console.log('1. Try to load content from Bubble first');
      console.log('2. Use this data instead of static seed data');
      console.log('3. Fall back to static data only if Bubble fails');
    }

    return success;

  } catch (error) {
    console.error('❌ Initial content loading failed:', error);
    return false;
  }
}

testInitialContentLoading().then(success => {
  console.log(`\n🏁 Test completed: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
}).catch(console.error);