// Quick test to verify Bubble API connection from mobile app config
const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-test/api/1.1';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function testBubbleConnection() {
  console.log('🧪 Testing Bubble API Connection');
  console.log('=================================');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log('');

  const endpoints = [
    { name: 'Levels', path: '/obj/level' },
    { name: 'Lessons', path: '/obj/lesson' },
    { name: 'Quizzes', path: '/obj/quiz' }
  ];

  let allSuccess = true;

  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Testing ${endpoint.name}...`);
      const url = `${BASE_URL}${endpoint.path}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 200)}`);
        allSuccess = false;
        continue;
      }

      const data = await response.json();
      const results = data.response?.results || [];
      console.log(`✅ ${endpoint.name}: ${results.length} records found`);

      if (results.length > 0) {
        const sample = results[0];
        console.log(`   Sample ID: ${sample._id}`);
        console.log(`   Sample Title: "${sample.title}"`);
      }

    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      allSuccess = false;
    }
    console.log('');
  }

  console.log('=================================');
  if (allSuccess) {
    console.log('✅ All Bubble API endpoints are accessible!');
    console.log('📱 Mobile app should be able to fetch data from Bubble.');
  } else {
    console.log('❌ Some Bubble API endpoints failed.');
    console.log('🔧 Check your Bubble app configuration and API permissions.');
  }

  return allSuccess;
}

testBubbleConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
