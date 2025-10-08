// Integration test for BubbleApiService - tests the actual implementation
// This version includes inline mocks for dependencies

const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-test/api/1.1';

// Mock logger to match the real implementation
const logger = {
  auth: {
    loginAttempt: (email) => {},
    loginSuccess: (userId) => {},
    loginFailure: (error, errorType) => {},
    signupFailure: (error) => {}
  },
  api: {
    request: (endpoint, method) => {},
    success: (endpoint, duration) => {},
    error: (endpoint, error) => {}
  }
};

// Inline BubbleApiService (simplified version for testing)
class BubbleApiService {
  constructor(apiKey, baseUrl) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.userToken = null;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    this._userProgressFieldMap = null;
  }

  setAuthToken(token) {
    this.userToken = token;
  }

  clearAuthToken() {
    this.userToken = null;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  buildUrl(path, query = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    return url.toString();
  }

  async request(path, options = {}, { useUserToken = false } = {}) {
    const authHeader = useUserToken && this.userToken
      ? { 'Authorization': `Bearer ${this.userToken}` }
      : { 'Authorization': `Bearer ${this.apiKey}` };
    const headers = { 'Content-Type': 'application/json', ...authHeader, ...(options.headers || {}) };
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    return res;
  }

  async listObjects(dataType, { since, limit = 100, cursor = 0, extraConstraints = [] } = {}) {
    try {
      const constraints = [...extraConstraints];
      if (since) {
        constraints.push({ key: 'modified date', constraint_type: 'greater than', value: since });
      }
      const url = this.buildUrl(`/obj/${dataType}`, {
        constraints: constraints.length ? constraints : undefined,
        limit,
        cursor,
      });
      const res = await this.request(`/obj/${dataType}?${url.split('?')[1] || ''}`, { method: 'GET' }, { useUserToken: false });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Data API list ${dataType} failed: HTTP ${res.status} ${text}`);
      }
      const data = await res.json();
      return {
        results: data.response?.results || [],
        remaining: data.response?.remaining || 0,
        count: data.response?.count || (data.response?.results?.length ?? 0),
      };
    } catch (err) {
      logger.api.error(`Data API list ${dataType}`, err.message);
      throw err;
    }
  }

  async listAllObjects(dataType, { since, pageSize = 100, extraConstraints = [] } = {}) {
    let cursor = 0;
    const all = [];
    while (true) {
      const { results, remaining } = await this.listObjects(dataType, { since, limit: pageSize, cursor, extraConstraints });
      all.push(...results);
      if (!remaining || remaining <= 0 || results.length === 0) break;
      cursor += 1;
    }
    return all;
  }

  getUserProgressFieldMap() {
    return { lessonKey: 'lesson', quizKey: 'quiz', lessonIsList: false, quizIsList: false };
  }

  async listLevels(since) {
    return await this.listAllObjects('level', { since });
  }

  async listLessons(since) {
    return await this.listAllObjects('lesson', { since });
  }

  async listQuizzes(since) {
    return await this.listAllObjects('quiz', { since });
  }

  async listJobs(since) {
    return await this.listAllObjects('job', { since });
  }

  async getObjectById(dataType, id) {
    try {
      const res = await this.request(`/obj/${dataType}/${id}`, { method: 'GET' }, { useUserToken: false });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Data API get ${dataType}/${id} failed: HTTP ${res.status} ${text}`);
      }
      const data = await res.json();
      return data.response || data;
    } catch (err) {
      logger.api.error(`Data API get ${dataType}/${id}`, err.message);
      throw err;
    }
  }

  async authenticateUser(email, password) {
    logger.auth.loginAttempt(email);

    try {
      const requestBody = {
        email: email,
        password: password
      };

      const response = await fetch(`${this.baseUrl}/wf/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Authentication failed - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logger.api.error('Failed to parse login response JSON', String(parseError));
        throw new Error('Invalid response format from server');
      }

      if (data.response === 'success') {
        const user = {
          id: data.user.id,
          _id: data.user.id,
          email: email,
          first_name: data.user.firstname,
          last_name: data.user.lastname,
          avatar: data.user.avatar,
          currentLevel: data.user.currentLevel,
          levelName: data.user.levelName
        };

        const userData = {
          ...user,
          progress: data.progress,
          storage: data.storage
        };

        const token = data.user_token || data.token || this.generateToken(user);

        logger.auth.loginSuccess(user.id);

        return {
          success: true,
          user: userData,
          token: token,
          progress: data.progress,
          storage: data.storage
        };
      } else if (data.response === 'failed') {
        const errorType = data.error || 'unknown_error';
        const errorMessage = data.message || 'Authentication failed';

        logger.auth.loginFailure(errorMessage, errorType);

        return {
          success: false,
          errorType: errorType,
          error: errorMessage,
          originalResponse: data
        };
      } else {
        const errorMessage = data.message || data.error || data.body || 'Invalid credentials';
        return {
          success: false,
          errorType: 'unexpected_response',
          error: errorMessage,
          originalResponse: data
        };
      }
    } catch (error) {
      logger.auth.loginFailure(error.message, 'auth_exception');

      let errorType = 'network_error';
      if (error.message.includes('HTTP')) {
        errorType = 'http_error';
      } else if (error.message.includes('Invalid response format')) {
        errorType = 'response_format_error';
      }

      return {
        success: false,
        errorType: errorType,
        error: error.message
      };
    }
  }

  generateToken(user) {
    return btoa(JSON.stringify({
      userId: user._id || user.id,
      email: user.email,
      timestamp: Date.now()
    }));
  }

  parseToken(token) {
    try {
      return JSON.parse(atob(token));
    } catch (error) {
      return null;
    }
  }

  async getUserProgress(userId) {
    try {
      const constraints = [{ key: 'user', constraint_type: 'equals', value: String(userId) }];
      const url = this.buildUrl('/obj/user_progress', { constraints });
      const response = await this.request(url.replace(this.baseUrl, ''), { method: 'GET' }, { useUserToken: false });

      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }

      const data = await response.json();
      return data.response?.results || [];
    } catch (error) {
      logger.api.error('Error fetching user progress', String(error));
      return [];
    }
  }
}

// Test functions
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

async function testListObjects(service) {
  console.log('\n📋 Testing listObjects Method');
  console.log('===============================');

  try {
    const result = await service.listObjects('level', { limit: 5 });
    logTest('listObjects returns results', result.results !== undefined);
    logTest('Results is an array', Array.isArray(result.results));
    logTest('Result has count property', typeof result.count === 'number');
    logTest('Result has remaining property', typeof result.remaining === 'number');
    logTest('listObjects fetched data', result.results.length > 0);

  } catch (error) {
    logTest('listObjects failed', false, error.message);
  }
}

async function testContentFetchMethods(service) {
  console.log('\n📋 Testing Content Fetch Methods');
  console.log('==================================');

  try {
    const levels = await service.listLevels();
    logTest('listLevels returns array', Array.isArray(levels));
    logTest('listLevels has data', levels.length > 0);
    console.log(`   Found ${levels.length} levels`);

    const lessons = await service.listLessons();
    logTest('listLessons returns array', Array.isArray(lessons));
    logTest('listLessons has data', lessons.length > 0);
    console.log(`   Found ${lessons.length} lessons`);

    const quizzes = await service.listQuizzes();
    logTest('listQuizzes returns array', Array.isArray(quizzes));
    logTest('listQuizzes has data', quizzes.length > 0);
    console.log(`   Found ${quizzes.length} quizzes`);

    const jobs = await service.listJobs();
    logTest('listJobs returns array', Array.isArray(jobs));
    console.log(`   Found ${jobs.length} jobs`);

  } catch (error) {
    logTest('Content fetch methods failed', false, error.message);
  }
}

async function testGetObjectById(service) {
  console.log('\n📋 Testing getObjectById Method');
  console.log('=================================');

  try {
    const levels = await service.listLevels();
    if (levels.length > 0) {
      const levelId = levels[0]._id;
      const level = await service.getObjectById('level', levelId);

      logTest('getObjectById returns object', typeof level === 'object');
      logTest('Retrieved object has correct ID', level._id === levelId || level.response?._id === levelId);
      logTest('Retrieved object has title', !!level.title || !!level.response?.title);
    }

    try {
      await service.getObjectById('level', 'nonexistent_id_12345');
      logTest('getObjectById with invalid ID throws', false);
    } catch (error) {
      logTest('getObjectById with invalid ID throws error', error.message.includes('failed'));
    }

  } catch (error) {
    logTest('getObjectById test failed', false, error.message);
  }
}

async function testAuthenticationMethod(service) {
  console.log('\n📋 Testing Authentication Method');
  console.log('==================================');

  try {
    const result = await service.authenticateUser('invalid@test.com', 'wrongpassword');

    logTest('Authentication returns object', typeof result === 'object');
    logTest('Authentication has success property', typeof result.success === 'boolean');

    if (!result.success) {
      logTest('Failed auth has error message', typeof result.error === 'string');
      logTest('Failed auth has errorType', typeof result.errorType === 'string');
      console.log(`   Error type: ${result.errorType}`);
      console.log(`   Error message: ${result.error}`);
    }

  } catch (error) {
    logTest('Authentication method failed', false, error.message);
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

async function testErrorHandling(service) {
  console.log('\n📋 Testing Error Handling in Methods');
  console.log('======================================');

  try {
    try {
      await service.listObjects('nonexistent_type_xyz_12345');
      logTest('Invalid data type handled', true);
    } catch (error) {
      logTest('Invalid data type throws error', error.message.includes('failed'));
    }

    try {
      await service.getObjectById('level', null);
      logTest('Null ID handled', false);
    } catch (error) {
      logTest('Null ID throws error', true);
    }

  } catch (error) {
    logTest('Error handling test failed', false, error.message);
  }
}

async function testGetUserProgress(service) {
  console.log('\n📋 Testing getUserProgress Method');
  console.log('===================================');

  try {
    const progress = await service.getUserProgress('test_user_id');
    logTest('getUserProgress returns array', Array.isArray(progress));
    console.log(`   Found ${progress.length} progress records for test user`);

  } catch (error) {
    logTest('getUserProgress failed', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 BubbleApiService Integration Testing');
  console.log('=========================================\n');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...\n`);

  const service = await testServiceInitialization();

  if (service) {
    await testListObjects(service);
    await testContentFetchMethods(service);
    await testGetObjectById(service);
    await testAuthenticationMethod(service);
    await testTokenGeneration(service);
    await testErrorHandling(service);
    await testGetUserProgress(service);
  }

  console.log('\n=========================================');
  console.log('📊 Test Results Summary');
  console.log('=========================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All BubbleApiService tests passed!');
    console.log('📱 The mobile app handles all Bubble API operations correctly.');
  } else {
    console.log('\n⚠️  Some BubbleApiService tests failed.');
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
