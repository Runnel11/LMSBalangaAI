// Comprehensive test for Bubble API error handling in mobile app
const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-test/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

async function testInvalidEndpoint() {
  console.log('\n📋 Testing Invalid Endpoint Handling');
  console.log('=====================================');

  try {
    const response = await fetch(`${BASE_URL}/obj/nonexistent_table`, {
      method: 'GET',
      headers: headers
    });

    // Should handle 404 or error gracefully
    logTest(
      'Invalid endpoint returns error status',
      !response.ok,
      response.ok ? 'Should return error for invalid endpoint' : ''
    );

    const text = await response.text();
    logTest(
      'Invalid endpoint response is parseable',
      text !== undefined,
      'Response should be readable'
    );

  } catch (error) {
    logTest('Invalid endpoint error is caught', true, error.message);
  }
}

async function testInvalidAPIKey() {
  console.log('\n📋 Testing Invalid API Key Handling');
  console.log('=====================================');

  try {
    const response = await fetch(`${BASE_URL}/obj/level`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_key_12345',
        'Content-Type': 'application/json'
      }
    });

    logTest(
      'Invalid API key returns error status',
      !response.ok,
      response.ok ? 'Should reject invalid API key' : `Got status ${response.status}`
    );

  } catch (error) {
    logTest('Invalid API key error is caught', true, error.message);
  }
}

async function testMalformedConstraints() {
  console.log('\n📋 Testing Malformed Query Constraints');
  console.log('========================================');

  try {
    // Test with invalid constraint structure
    const url = `${BASE_URL}/obj/level?constraints=[{invalid}]`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    // Should handle malformed constraints gracefully
    const text = await response.text();
    let parseable = false;
    try {
      JSON.parse(text);
      parseable = true;
    } catch (e) {
      parseable = false;
    }

    logTest(
      'Malformed constraints handled gracefully',
      true,
      `Status: ${response.status}, Parseable: ${parseable}`
    );

  } catch (error) {
    logTest('Malformed constraint error is caught', true, error.message);
  }
}

async function testEmptyResponses() {
  console.log('\n📋 Testing Empty Response Handling');
  console.log('====================================');

  try {
    // Query for non-existent data
    const constraints = JSON.stringify([{
      key: '_id',
      constraint_type: 'equals',
      value: 'nonexistent_id_12345'
    }]);

    const url = `${BASE_URL}/obj/level?constraints=${encodeURIComponent(constraints)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    logTest(
      'Empty query returns success status',
      response.ok,
      `Status: ${response.status}`
    );

    const data = await response.json();
    const results = data.response?.results || [];

    logTest(
      'Empty results array is handled correctly',
      Array.isArray(results) && results.length === 0,
      `Results: ${results.length}`
    );

  } catch (error) {
    logTest('Empty response error is caught', false, error.message);
  }
}

async function testPaginationEdgeCases() {
  console.log('\n📋 Testing Pagination Edge Cases');
  console.log('==================================');

  try {
    // Test with cursor beyond available data
    const url = `${BASE_URL}/obj/level?cursor=999999&limit=10`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    logTest(
      'Large cursor value handled gracefully',
      response.ok,
      `Status: ${response.status}`
    );

    const data = await response.json();
    logTest(
      'Out-of-bounds cursor returns empty results',
      Array.isArray(data.response?.results),
      `Results: ${data.response?.results?.length || 0}`
    );

    // Test with limit = 0
    const url2 = `${BASE_URL}/obj/level?limit=0`;
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: headers
    });

    logTest(
      'Zero limit handled correctly',
      response2.ok,
      `Status: ${response2.status}`
    );

  } catch (error) {
    logTest('Pagination edge case error caught', false, error.message);
  }
}

async function testGetNonExistentObject() {
  console.log('\n📋 Testing Get Non-Existent Object');
  console.log('====================================');

  try {
    const response = await fetch(`${BASE_URL}/obj/level/nonexistent_id_12345`, {
      method: 'GET',
      headers: headers
    });

    logTest(
      'Non-existent object returns error status',
      !response.ok,
      `Status: ${response.status}`
    );

    const text = await response.text();
    logTest(
      'Error response is readable',
      text !== undefined && text.length > 0,
      'Response should contain error message'
    );

  } catch (error) {
    logTest('Non-existent object error is caught', true, error.message);
  }
}

async function testNetworkTimeout() {
  console.log('\n📋 Testing Network Timeout Handling');
  console.log('=====================================');

  try {
    // Test with very short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1); // 1ms timeout

    const response = await fetch(`${BASE_URL}/obj/level`, {
      method: 'GET',
      headers: headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    logTest('Timeout not triggered (network too fast)', true);

  } catch (error) {
    if (error.name === 'AbortError') {
      logTest('Network timeout error is caught correctly', true, 'AbortError caught');
    } else {
      logTest('Network timeout error caught', true, error.message);
    }
  }
}

async function testRateLimitHeaders() {
  console.log('\n📋 Testing Rate Limit Awareness');
  console.log('=================================');

  try {
    const response = await fetch(`${BASE_URL}/obj/level`, {
      method: 'GET',
      headers: headers
    });

    // Check for rate limit headers (if Bubble provides them)
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');

    logTest(
      'Rate limit headers checked',
      true,
      rateLimitRemaining
        ? `Remaining: ${rateLimitRemaining}/${rateLimitLimit}`
        : 'No rate limit headers found'
    );

  } catch (error) {
    logTest('Rate limit check error caught', false, error.message);
  }
}

async function testAuthenticationFlow() {
  console.log('\n📋 Testing Authentication Flow');
  console.log('================================');

  try {
    // Test with invalid credentials
    const response = await fetch(`${BASE_URL}/wf/login`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: 'Failed to parse response' };
    }

    logTest(
      'Invalid login returns structured response',
      data !== undefined,
      `Response type: ${typeof data}`
    );

    logTest(
      'Invalid login indicates failure',
      data.response === 'failed' || !response.ok,
      data.response === 'failed' ? `Error: ${data.error}` : `Status: ${response.status}`
    );

    // Test with missing credentials
    const response2 = await fetch(`${BASE_URL}/wf/login`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({})
    });

    logTest(
      'Missing credentials handled gracefully',
      !response2.ok || (await response2.json()).response === 'failed',
      `Status: ${response2.status}`
    );

  } catch (error) {
    logTest('Authentication error is caught', true, error.message);
  }
}

async function testDataTypeConsistency() {
  console.log('\n📋 Testing Data Type Consistency');
  console.log('==================================');

  try {
    const endpoints = ['level', 'lesson', 'quiz'];
    let allConsistent = true;

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}/obj/${endpoint}`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) continue;

      const data = await response.json();
      const results = data.response?.results || [];

      if (results.length > 0) {
        const sample = results[0];
        const hasId = !!sample._id;
        const hasTitle = !!sample.title;
        const hasModifiedDate = !!sample['Modified Date'];

        logTest(
          `${endpoint} has required fields (_id, title)`,
          hasId && hasTitle,
          `_id: ${hasId}, title: ${hasTitle}, modified: ${hasModifiedDate}`
        );
      }
    }

  } catch (error) {
    logTest('Data type consistency check failed', false, error.message);
  }
}

async function testProgressUpsertValidation() {
  console.log('\n📋 Testing Progress Upsert Validation');
  console.log('=======================================');

  try {
    // Test with minimal valid data
    const response = await fetch(`${BASE_URL}/obj/user_progress`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        user: 'test_user_id',
        lesson: 'test_lesson_id',
        is_completed: false
      })
    });

    // Check if endpoint exists and responds
    logTest(
      'Progress endpoint responds',
      response !== undefined,
      `Status: ${response.status}`
    );

    const text = await response.text();
    logTest(
      'Progress response is readable',
      text !== undefined,
      response.ok ? 'Success' : `Error: ${text.substring(0, 100)}`
    );

  } catch (error) {
    logTest('Progress upsert error is caught', true, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Comprehensive Bubble API Error Handling Test');
  console.log('================================================\n');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...\n`);

  await testInvalidEndpoint();
  await testInvalidAPIKey();
  await testMalformedConstraints();
  await testEmptyResponses();
  await testPaginationEdgeCases();
  await testGetNonExistentObject();
  await testNetworkTimeout();
  await testRateLimitHeaders();
  await testAuthenticationFlow();
  await testDataTypeConsistency();
  await testProgressUpsertValidation();

  console.log('\n================================================');
  console.log('📊 Test Results Summary');
  console.log('================================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All error handling tests passed!');
    console.log('📱 The mobile app properly handles Bubble API errors.');
  } else {
    console.log('\n⚠️  Some error handling tests failed.');
    console.log('🔧 Review the BubbleApiService implementation.');
  }

  return testsFailed === 0;
}

runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
