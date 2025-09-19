// Debug tool to help verify Bubble.io setup
const API_KEY = process.env.EXPO_PUBLIC_BUBBLE_API_KEY || '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-test/api/1.1';

async function checkBubbleSetup() {
  console.log('🔍 Bubble.io Setup Verification');
  console.log('================================');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  // Test 1: Check if app exists
  console.log('📋 Step 1: Testing if app is accessible...');
  try {
    const response = await fetch(BASE_URL.replace('/api/1.1', ''));
    console.log(`✅ App URL Status: ${response.status}`);

    if (response.status === 404) {
      console.log('❌ App not found! Check your URL.');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot reach app:', error.message);
    return;
  }

  // Test 2: Check API metadata endpoint
  console.log('\n📋 Step 2: Checking API metadata...');
  try {
    const metaResponse = await fetch(`${BASE_URL}/meta`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    console.log(`Meta endpoint status: ${metaResponse.status}`);

    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      console.log('✅ API is accessible');
      console.log('Available data types:', Object.keys(metaData.types || {}));

      // Check if our required types exist
      const requiredTypes = ['level', 'lesson', 'quiz', 'job'];
      const availableTypes = Object.keys(metaData.types || {});

      console.log('\n📋 Step 3: Checking required data types...');
      requiredTypes.forEach(type => {
        const exists = availableTypes.some(t => t.toLowerCase().includes(type.toLowerCase()));
        console.log(`${exists ? '✅' : '❌'} ${type}: ${exists ? 'Found' : 'Missing'}`);
      });

    } else {
      const errorText = await metaResponse.text();
      console.log('❌ API Metadata Error:', errorText);
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }

  // Test 3: Manual verification steps
  console.log('\n📋 Manual Verification Steps:');
  console.log('=============================');
  console.log('1. Go to your Bubble app editor');
  console.log('2. Click Settings → API');
  console.log('3. Check "Enable Data API" checkbox');
  console.log('4. Save settings');
  console.log('');
  console.log('5. Go to Data → Data types');
  console.log('6. For each data type (Level, Lesson, Quiz, Job):');
  console.log('   - Click on the data type');
  console.log('   - Click "Privacy Rules" tab');
  console.log('   - Add rule: When "Everyone" → "searchable via API" = YES');
  console.log('   - Add rule: When "Everyone" → "view all fields via API" = YES');
  console.log('');
  console.log('7. Make sure data types are named exactly:');
  console.log('   - Level (not level or LEVEL)');
  console.log('   - Lesson (not lesson or LESSON)');
  console.log('   - Quiz (not quiz or QUIZ)');
  console.log('   - Job (not job or JOB)');
  console.log('');
  console.log('8. After making changes, wait 2-3 minutes for Bubble to update');
  console.log('9. Run this test again: node debug_bubble_setup.js');
}

checkBubbleSetup().catch(console.error);