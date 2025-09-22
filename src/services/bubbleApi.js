// Bubble.io API Service for authentication and data synchronization
export class BubbleApiService {
  constructor(apiKey, baseUrl = 'https://balangaai.bubbleapps.io/version-test/api/1.1') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.userToken = null;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    // Cache for detected user_progress field names
    this._userProgressFieldMap = null;
  }

  // Set user authentication token
  setAuthToken(token) {
    this.userToken = token;
    // Keep default headers as API key; we'll choose token vs apiKey per request type
  }

  // Clear authentication token
  clearAuthToken() {
    this.userToken = null;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Build URL with optional query params
  buildUrl(path, query = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    return url.toString();
  }

  // Internal: perform fetch with appropriate headers
  async request(path, options = {}, { useUserToken = false } = {}) {
    const authHeader = useUserToken && this.userToken
      ? { 'Authorization': `Bearer ${this.userToken}` }
      : { 'Authorization': `Bearer ${this.apiKey}` };
    const headers = { 'Content-Type': 'application/json', ...authHeader, ...(options.headers || {}) };
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    return res;
  }

  // Offline-friendly token validation: allow app to continue without network
  async validateToken(token) {
    try {
      // If no token provided, treat as unauthenticated but don't block offline usage
      if (!token) return true;
      // Optionally, you could ping a lightweight endpoint; for offline-first, just return true
      return true;
    } catch {
      return true; // do not block app on validation
    }
  }

  // ========== Data API helpers (Bubble /obj endpoints) ==========
  // Generic list with pagination and optional modified date filter
  async listObjects(dataType, { since, limit = 100, cursor = 0, extraConstraints = [] } = {}) {
    try {
      const constraints = [...extraConstraints];
      if (since) {
        // Bubble expects key name as "modified date" in constraints
        constraints.push({ key: 'modified date', constraint_type: 'greater than', value: since });
      }
      const url = this.buildUrl(`/obj/${dataType}`, {
        constraints: constraints.length ? constraints : undefined,
        limit,
        cursor,
      });
      // Data API should always use API key; do not send user token here
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
      console.error('Bubble Data API list error:', dataType, err.message);
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

  // No auto-detection: standardize to Bubble field keys 'user', 'lesson', 'quiz'
  getUserProgressFieldMap() {
    return { lessonKey: 'lesson', quizKey: 'quiz', lessonIsList: false, quizIsList: false };
  }

  async listLevels(since) {
    // Use Data API exclusively for formal content fetching
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

  // Fetch a single object by unique id from the Data API
  async getObjectById(dataType, id) {
    try {
      const res = await this.request(`/obj/${dataType}/${id}`, { method: 'GET' }, { useUserToken: false });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Data API get ${dataType}/${id} failed: HTTP ${res.status} ${text}`);
      }
      const data = await res.json();
      // Some Bubble responses nest under response
      return data.response || data;
    } catch (err) {
      console.error('Bubble Data API getObjectById error:', dataType, id, err.message);
      throw err;
    }
  }

  // Upsert progress using Data API with idempotency by composite key
  async upsertProgress(progress) {
    // Map incoming fields to Bubble keys: user, lesson, quiz
    const userVal = String(progress.user ?? progress.user_id ?? '');
    const lessonVal = progress.lesson != null ? String(progress.lesson) : (progress.lesson_id != null ? String(progress.lesson_id) : null);
    const quizVal = progress.quiz != null ? String(progress.quiz) : (progress.quiz_id != null ? String(progress.quiz_id) : null);
    try {
      const { lessonKey, quizKey } = this.getUserProgressFieldMap();
      // 1) Try find existing progress for user/lesson/quiz
      const constraintParts = [ { key: 'user', constraint_type: 'equals', value: userVal } ];
      if (lessonVal && lessonKey) constraintParts.push({ key: lessonKey, constraint_type: 'equals', value: lessonVal });
      if (quizVal && quizKey) constraintParts.push({ key: quizKey, constraint_type: 'equals', value: quizVal });

      const existing = await this.listAllObjects('user_progress', {
        extraConstraints: constraintParts,
      });

      // Normalize payload to match Bubble field types
      const payload = {
        user: userVal,
        is_completed: typeof progress.is_completed === 'boolean' ? progress.is_completed : !!progress.is_completed,
        score: progress.score ?? null,
        completed_at: progress.completed_at ?? new Date().toISOString(),
      };
      if (lessonVal && lessonKey) payload[lessonKey] = lessonVal;
      if (quizVal && quizKey) payload[quizKey] = quizVal;

      if (existing && existing.length > 0) {
        const existingRow = existing[0] || {};
        const id = existingRow._id || existingRow.id;
        const res = await fetch(`${this.baseUrl}/obj/user_progress/${id}`, {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`PATCH user_progress failed: HTTP ${res.status} ${text}`);
        }
        return await res.json();
      }

      // 2) Create new
      const res = await fetch(`${this.baseUrl}/obj/user_progress`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST user_progress failed: HTTP ${res.status} ${text}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Bubble Data API upsertProgress error:', err.message);
      throw err;
    }
  }

  // Authentication methods
  async authenticateUser(email, password) {
    console.log('🔐 Attempting login with:', { email, baseUrl: this.baseUrl });

    try {
      const requestBody = {
        email: email,
        password: password
      };

      console.log('📤 Sending request to:', `${this.baseUrl}/wf/login`);
      console.log('📤 Request headers:', {
        'Authorization': `Bearer ${this.apiKey.substring(0, 8)}...`,
        'Content-Type': 'application/json'
      });
      console.log('📤 Request body:', requestBody);

      // Call your Bubble login endpoint that returns a user token
      const response = await fetch(`${this.baseUrl}/wf/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);

      // Log the exact response format for debugging
      console.log('📥 Response type:', typeof responseText);
      console.log('📥 Response length:', responseText.length);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Authentication failed - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      console.log('📥 Parsed response:', data);

      // Handle your specific Bubble response format
      // SUCCESS: { "response": "success", "user": {...}, "token": "...", ... }
      // FAILURE: { "response": "failed", "error": "account_not_found", "message": "The requested account does not exist." }
      if (data.response === 'success') {
        const user = {
          id: data.user.id,
          _id: data.user.id, // Also add _id for compatibility
          email: email,
          first_name: data.user.firstname,
          last_name: data.user.lastname,
          avatar: data.user.avatar,
          currentLevel: data.user.currentLevel,
          levelName: data.user.levelName
        };

        // Store additional data for the app
        const userData = {
          ...user,
          progress: data.progress,
          storage: data.storage
        };

        const token = data.user_token || data.token || this.generateToken(user);

        console.log('✅ Login successful:', {
          user: userData,
          token: token.substring(0, 10) + '...',
          progress: data.progress,
          storage: data.storage
        });

        return {
          success: true,
          user: userData,
          token: token,
          progress: data.progress,
          storage: data.storage
        };
      } else if (data.response === 'failed') {
        // Handle specific Bubble error types from the exact response format:
        // { "response":"failed", "error": "account_not_found", "message": "The requested account does not exist." }
        const errorType = data.error || 'unknown_error';
        const errorMessage = data.message || 'Authentication failed';

        console.log('❌ Bubble authentication failed:', {
          error: errorType,
          message: errorMessage,
          fullResponse: data
        });

        // Special handling for account_not_found error
        if (errorType === 'account_not_found') {
          console.log('🔍 Account not found - this should trigger signup flow');
        }

        // Return structured error response
        return {
          success: false,
          errorType: errorType,
          error: errorMessage,
          originalResponse: data
        };
      } else {
        // Handle unexpected response format
        const errorMessage = data.message || data.error || data.body || 'Invalid credentials';
        return {
          success: false,
          errorType: 'unexpected_response',
          error: errorMessage,
          originalResponse: data
        };
      }
    } catch (error) {
      console.error('❌ Bubble authentication error:', error);

      // Determine error type based on error characteristics
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

  // Validate if a stored token is still valid
  async validateToken(token) {
    try {
      // Use a simple endpoint to test token validity
      const response = await fetch(`${this.baseUrl}/wf/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.response === 'success' && data.valid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false; // Assume invalid on error
    }
  }

  async createUser(userData) {
    try {
      // Call your Bubble signup endpoint that creates user and returns token
      const response = await fetch(`${this.baseUrl}/wf/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('User creation failed');
      }

      const data = await response.json();

      if (data.response === 'success' && data.id) {
        // After successful signup, automatically log the user in
        const loginResult = await this.authenticateUser(userData.email, userData.password);

        if (loginResult.success) {
          return loginResult;
        } else {
          // If auto-login fails, still return success with user data from signup
          return {
            success: true,
            user: {
              _id: data.id,
              id: data.id,
              email: userData.email,
              first_name: data.firstname || userData.first_name || '',
              last_name: data.lastname || userData.last_name || '',
              avatar: data.avatar || ''
            },
            token: this.generateToken({
              _id: data.id,
              email: userData.email
            })
          };
        }
      } else {
        throw new Error('An account with this email already exists.');
      }
    } catch (error) {
      console.error('Bubble user creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Data synchronization methods
  async syncLevels() {
    try {
      // Formalize sync via Data API as well
      const response = await this.request('/obj/level', { method: 'GET' }, { useUserToken: false });

      if (!response.ok) {
        throw new Error('Failed to fetch levels');
      }

      const data = await response.json();
      return data.response?.results || [];
    } catch (error) {
      console.error('Error syncing levels:', error);
      return [];
    }
  }

  async syncLessons() {
    try {
      const response = await this.request('/obj/lesson', { method: 'GET' }, { useUserToken: false });

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      return data.response?.results || [];
    } catch (error) {
      console.error('Error syncing lessons:', error);
      return [];
    }
  }

  async syncQuizzes() {
    try {
      const response = await this.request('/obj/quiz', { method: 'GET' }, { useUserToken: false });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      return data.response?.results || [];
    } catch (error) {
      console.error('Error syncing quizzes:', error);
      return [];
    }
  }

  async syncJobs() {
    try {
      // Jobs via Data API; use API key
      // Use the same list method for consistency/pagination
      return await this.listAllObjects('job');
    } catch (error) {
      console.error('Error syncing jobs:', error);
      return [];
    }
  }

  async syncUserProgress(userId, progressData) {
    try {
      const response = await fetch(`${this.baseUrl}/obj/user_progress`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          ...progressData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing user progress:', error);
      throw error;
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
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  // Utility methods
  generateToken(user) {
    // Simple token generation - in production, use proper JWT
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
}

// Default instance - configure with your Bubble app details
export const bubbleApi = new BubbleApiService(
  process.env.EXPO_PUBLIC_BUBBLE_API_KEY || '2bcbbf27c42d9a0e78596d63b03fd1e2',
  process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-test/api/1.1'
);