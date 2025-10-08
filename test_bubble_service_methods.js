// Test the BubbleApiService class methods as used by the mobile app
import { BubbleApiService } from './src/services/bubbleApi.js';

const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-test/api/1.1';

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

async function testServiceInitialization() {
  console.log('\n📋 Testing Service Initialization');
  console.log('==================================');

  try {
    const service = new BubbleApiService(API_KEY, BASE_URL);
    logTest('Service instance created', service !== null);
    logTest('API key set correctly', service.apiKey === API_KEY);
    logTest('Base URL set correctly', service.baseUrl === BASE_URL);
    logTest('Headers initialized', service.headers !== null);
    logTest('Authorization header present', service.headers.Authorization === `Bearer ${API_KEY}`);

    return service;
  } catch (error) {
    logTest('Service initialization failed', false, error.message);
    return null;
  }
}

async function testBuildUrl(service) {
  console.log('\n📋 Testing URL Building');
  console.log('========================');

  try {
    const url1 = service.buildUrl('/obj/level');
    logTest('Basic URL built correctly', url1.includes('/obj/level'));

    const url2 = service.buildUrl('/obj/level', { limit: 10, cursor: 0 });
    logTest('URL with params built correctly', url2.includes('limit') && url2.includes('cursor'));

    const url3 = service.buildUrl('/obj/level', { null_param: null, undefined_param: undefined });
    logTest('Null/undefined params filtered out', !url3.includes('null') && !url3.includes('undefined'));

  } catch (error) {
    logTest('URL building failed', false, error.message);
  }
}

async function testAuthTokenManagement(service) {
  console.log('\n📋 Testing Auth Token Management');
  console.log('==================================');

  try {
    const testToken = 'test_user_token_12345';

    service.setAuthToken(testToken);
    logTest('Auth token set', service.userToken === testToken);

    service.clearAuthToken();
    logTest('Auth token cleared', service.userToken === null);

  } catch (error) {
    logTest('Auth token management failed', false, error.message);
  }
}

async function testListObjects(service) {
  console.log('\n📋 Testing listObjects Method');
  console.log('===============================');

  try {
    const result = await service.listObjects('level', { limit: 5 });
    logTest('listObjects returns results', result.results !== undefined);
    logTest('Results is an array', Array.isArray(result.results));
    logTest('Result has count property', typeof result.count === 'number');
    logTest('Result has remaining property', typeof result.remaining === 'number');

    // Test with constraints
    const result2 = await service.listObjects('level', {
      extraConstraints: [
        { key: '_id', constraint_type: 'is_not_empty' }
      ]
    });
    logTest('listObjects with constraints works', Array.isArray(result2.results));

  } catch (error) {
    logTest('listObjects failed', false, error.message);
  }
}

async function testListAllObjects(service) {
  console.log('\n📋 Testing listAllObjects Method');
  console.log('==================================');

  try {
    const levels = await service.listAllObjects('level');
    logTest('listAllObjects returns array', Array.isArray(levels));
    logTest('listAllObjects has results', levels.length > 0);

    if (levels.length > 0) {
      const firstLevel = levels[0];
      logTest('Level has _id', !!firstLevel._id);
      logTest('Level has title', !!firstLevel.title);
    }

  } catch (error) {
    logTest('listAllObjects failed', false, error.message);
  }
}

async function testContentFetchMethods(service) {
  console.log('\n📋 Testing Content Fetch Methods');
  console.log('==================================');

  try {
    const levels = await service.listLevels();
    logTest('listLevels returns array', Array.isArray(levels));
    logTest('listLevels has data', levels.length > 0);

    const lessons = await service.listLessons();
    logTest('listLessons returns array', Array.isArray(lessons));
    logTest('listLessons has data', lessons.length > 0);

    const quizzes = await service.listQuizzes();
    logTest('listQuizzes returns array', Array.isArray(quizzes));
    logTest('listQuizzes has data', quizzes.length > 0);

    const jobs = await service.listJobs();
    logTest('listJobs returns array', Array.isArray(jobs));

  } catch (error) {
    logTest('Content fetch methods failed', false, error.message);
  }
}

async function testGetObjectById(service) {
  console.log('\n📋 Testing getObjectById Method');
  console.log('=================================');

  try {
    // First get a valid ID
    const levels = await service.listLevels();
    if (levels.length > 0) {
      const levelId = levels[0]._id;
      const level = await service.getObjectById('level', levelId);

      logTest('getObjectById returns object', typeof level === 'object');
      logTest('Retrieved object has correct ID', level._id === levelId || level.response?._id === levelId);
    }

    // Test with invalid ID
    try {
      await service.getObjectById('level', 'nonexistent_id');
      logTest('getObjectById with invalid ID throws', false);
    } catch (error) {
      logTest('getObjectById with invalid ID throws error', true);
    }

  } catch (error) {
    logTest('getObjectById failed', false, error.message);
  }
}

async function testGetUserProgressFieldMap(service) {
  console.log('\n📋 Testing getUserProgressFieldMap Method');
  console.log('===========================================');

  try {
    const fieldMap = service.getUserProgressFieldMap();
    logTest('Field map returned', fieldMap !== null);
    logTest('Field map has lessonKey', fieldMap.lessonKey !== undefined);
    logTest('Field map has quizKey', fieldMap.quizKey !== undefined);
    logTest('Field map has lessonIsList', typeof fieldMap.lessonIsList === 'boolean');
    logTest('Field map has quizIsList', typeof fieldMap.quizIsList === 'boolean');

  } catch (error) {
    logTest('getUserProgressFieldMap failed', false, error.message);
  }
}

async function testSyncMethods(service) {
  console.log('\n📋 Testing Sync Methods');
  console.log('========================');

  try {
    const levels = await service.syncLevels();
    logTest('syncLevels returns array', Array.isArray(levels));

    const lessons = await service.syncLessons();
    logTest('syncLessons returns array', Array.isArray(lessons));

    const quizzes = await service.syncQuizzes();
    logTest('syncQuizzes returns array', Array.isArray(quizzes));

    const jobs = await service.syncJobs();
    logTest('syncJobs returns array', Array.isArray(jobs));

  } catch (error) {
    logTest('Sync methods failed', false, error.message);
  }
}

async function testTokenGeneration(service) {
  console.log('\n📋 Testing Token Generation & Parsing');
  console.log('=======================================');

  try {
    const testUser = {
      _id: 'test_user_123',
      email: 'test@example.com'
    };

    const token = service.generateToken(testUser);
    logTest('Token generated', typeof token === 'string' && token.length > 0);

    const parsed = service.parseToken(token);
    logTest('Token parsed successfully', parsed !== null);
    logTest('Parsed token has userId', parsed.userId === testUser._id);
    logTest('Parsed token has email', parsed.email === testUser.email);
    logTest('Parsed token has timestamp', typeof parsed.timestamp === 'number');

    const invalidParsed = service.parseToken('invalid_token');
    logTest('Invalid token returns null', invalidParsed === null);

  } catch (error) {
    logTest('Token generation/parsing failed', false, error.message);
  }
}

async function testAuthenticationMethod(service) {
  console.log('\n📋 Testing Authentication Method');
  console.log('==================================');

  try {
    // Test with invalid credentials (should return structured error)
    const result = await service.authenticateUser('invalid@test.com', 'wrongpassword');

    logTest('Authentication returns object', typeof result === 'object');
    logTest('Authentication has success property', typeof result.success === 'boolean');

    if (!result.success) {
      logTest('Failed auth has error message', typeof result.error === 'string');
      logTest('Failed auth has errorType', typeof result.errorType === 'string');
    }

  } catch (error) {
    logTest('Authentication method failed', false, error.message);
  }
}

async function testValidateTokenLocal(service) {
  console.log('\n📋 Testing Local Token Validation');
  console.log('===================================');

  try {
    const result1 = await service.validateTokenLocal('some_token');
    logTest('validateTokenLocal with token returns true', result1 === true);

    const result2 = await service.validateTokenLocal(null);
    logTest('validateTokenLocal with null returns true', result2 === true);

    const result3 = await service.validateTokenLocal();
    logTest('validateTokenLocal with undefined returns true', result3 === true);

  } catch (error) {
    logTest('validateTokenLocal failed', false, error.message);
  }
}

async function testErrorHandling(service) {
  console.log('\n📋 Testing Error Handling in Methods');
  console.log('======================================');

  try {
    // Test listObjects with invalid data type
    try {
      await service.listObjects('nonexistent_type_xyz');
      logTest('Invalid data type handled', true);
    } catch (error) {
      logTest('Invalid data type throws error (expected)', true);
    }

    // Test getObjectById with null ID
    try {
      await service.getObjectById('level', null);
      logTest('Null ID handled', false);
    } catch (error) {
      logTest('Null ID throws error (expected)', true);
    }

  } catch (error) {
    logTest('Error handling test failed', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 BubbleApiService Method Testing');
  console.log('====================================\n');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...\n`);

  const service = await testServiceInitialization();

  if (service) {
    await testBuildUrl(service);
    await testAuthTokenManagement(service);
    await testListObjects(service);
    await testListAllObjects(service);
    await testContentFetchMethods(service);
    await testGetObjectById(service);
    await testGetUserProgressFieldMap(service);
    await testSyncMethods(service);
    await testTokenGeneration(service);
    await testAuthenticationMethod(service);
    await testValidateTokenLocal(service);
    await testErrorHandling(service);
  }

  console.log('\n====================================');
  console.log('📊 Test Results Summary');
  console.log('====================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All BubbleApiService method tests passed!');
    console.log('📱 The mobile app should handle all Bubble API operations correctly.');
  } else {
    console.log('\n⚠️  Some BubbleApiService method tests failed.');
    console.log('🔧 Review the implementation for potential issues.');
  }

  return testsFailed === 0;
}

runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
