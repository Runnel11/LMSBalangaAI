// Test script to verify Bubble.io endpoints
const API_KEY = process.env.EXPO_PUBLIC_BUBBLE_API_KEY || '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-02pdq/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function testEndpoint(endpoint, name) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`URL: ${BASE_URL}${endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success: Found ${data.response?.results?.length || 0} records`);

    // Show first record structure
    if (data.response?.results?.length > 0) {
      console.log(`📋 Sample record:`, JSON.stringify(data.response.results[0], null, 2));
    }

    return true;
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing Bubble.io GET Endpoints');
  console.log('=====================================');

  const tests = [
    ['wf/lesson', 'Lessons'],
    ['wf/quiz', 'Quizzes'],
    ['/wf/level', 'Levels (Workflow)']
  ];

  let passedTests = 0;

  for (const [endpoint, name] of tests) {
    const success = await testEndpoint(endpoint, name);
    if (success) passedTests++;

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`);

  if (passedTests === tests.length) {
    console.log('\n🎉 All endpoints working! Ready to test initial content loading.');
  } else {
    console.log('\n⚠️  Some endpoints failed. Please check your Bubble configuration.');
  }
}

// Run the tests
testAllEndpoints().catch(console.error);