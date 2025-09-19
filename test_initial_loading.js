// Test script to simulate initial content loading from Bubble
import { bubbleApi } from './src/services/bubbleApi.js';

async function testInitialContentLoading() {
  console.log('🚀 Testing Initial Content Loading from Bubble');
  console.log('===============================================');

  try {
    // Test network connectivity
    console.log('📡 Step 1: Checking network connectivity...');
    const testResponse = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      timeout: 5000
    });
    console.log(`✅ Network: ${testResponse.ok ? 'Online' : 'Offline'}`);

    if (!testResponse.ok) {
      console.log('❌ Cannot proceed - no internet connection');
      return false;
    }

    // Load all content types in parallel
    console.log('\n📋 Step 2: Loading content from Bubble API...');

    const startTime = Date.now();

    const [levels, lessons, quizzes] = await Promise.all([
      bubbleApi.syncLevels().catch(err => {
        console.log('❌ Levels error:', err.message);
        return [];
      }),
      bubbleApi.syncLessons().catch(err => {
        console.log('❌ Lessons error:', err.message);
        return [];
      }),
      bubbleApi.syncQuizzes().catch(err => {
        console.log('❌ Quizzes error:', err.message);
        return [];
      })
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Total load time: ${loadTime}ms`);

    // Validate loaded content
    console.log('\n📊 Step 3: Validating loaded content...');

    console.log(`📁 Levels loaded: ${levels.length}`);
    if (levels.length > 0) {
      console.log(`   ✅ Sample level: "${levels[0].title}"`);
      console.log(`   🆔 ID format: ${levels[0]._id}`);
    }

    console.log(`📚 Lessons loaded: ${lessons.length}`);
    if (lessons.length > 0) {
      console.log(`   ✅ Sample lesson: "${lessons[0].title}"`);
      console.log(`   🔗 Level link: ${lessons[0].level_id || 'MISSING'}`);
    }

    console.log(`❓ Quizzes loaded: ${quizzes.length}`);
    if (quizzes.length > 0) {
      console.log(`   ✅ Sample quiz: "${quizzes[0].title}"`);
      console.log(`   🔗 Lesson link: ${quizzes[0].lesson_id || 'MISSING'}`);
      console.log(`   📝 Questions: ${quizzes[0].questions || 'EMPTY'}`);
    }

    // Check for data issues
    console.log('\n🔍 Step 4: Checking data integrity...');

    let issues = [];

    // Check for missing relationships
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

    // Simulate database insertion
    console.log('\n💾 Step 5: Simulating database insertion...');
    console.log('   (This would normally insert into SQLite database)');

    for (const level of levels.slice(0, 2)) {
      console.log(`   ✅ Would insert level: ${level.title}`);
    }

    for (const lesson of lessons.slice(0, 3)) {
      console.log(`   ✅ Would insert lesson: ${lesson.title}`);
    }

    // Summary
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Content loaded: ${levels.length} levels, ${lessons.length} lessons, ${quizzes.length} quizzes`);
    console.log(`⏱️  Load time: ${loadTime}ms`);
    console.log(`⚠️  Issues: ${issues.length}`);

    const success = levels.length > 0 && lessons.length > 0;
    console.log(`🎯 Overall: ${success ? 'SUCCESS' : 'PARTIAL/FAILED'}`);

    return success;

  } catch (error) {
    console.error('❌ Initial content loading failed:', error);
    return false;
  }
}

// Export for ES modules
export { testInitialContentLoading };

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  testInitialContentLoading().then(success => {
    console.log(`\n🏁 Test completed: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  });
}