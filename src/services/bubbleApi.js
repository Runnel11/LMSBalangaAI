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
  }

  // Set user authentication token
  setAuthToken(token) {
    this.userToken = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Clear authentication token
  clearAuthToken() {
    this.userToken = null;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
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
        throw new Error('User creation failed');
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
      const response = await fetch(`${this.baseUrl}/wf/level`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch levels');
      }

      const data = await response.json();
      return data.response.results;
    } catch (error) {
      console.error('Error syncing levels:', error);
      return [];
    }
  }

  async syncLessons() {
    try {
      const response = await fetch(`${this.baseUrl}/wf/lesson`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      return data.response.results;
    } catch (error) {
      console.error('Error syncing lessons:', error);
      return [];
    }
  }

  async syncQuizzes() {
    try {
      const response = await fetch(`${this.baseUrl}/wf/quiz`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      return data.response.results;
    } catch (error) {
      console.error('Error syncing quizzes:', error);
      return [];
    }
  }

  async syncJobs() {
    try {
      const response = await fetch(`${this.baseUrl}/job`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      return data.response.results;
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
      const response = await fetch(`${this.baseUrl}/obj/user_progress`, {
        method: 'GET',
        headers: {
          ...this.headers,
          'Constraints': JSON.stringify([
            {
              key: 'user_id',
              constraint_type: 'equals',
              value: userId
            }
          ])
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }

      const data = await response.json();
      return data.response.results;
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
  process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-02pdq/api/1.1'
);