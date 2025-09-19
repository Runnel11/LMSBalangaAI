// Debug script to check exact response format from Bubble workflows
const API_KEY = '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = 'https://balangaai.bubbleapps.io/version-02pdq/api/1.1';

async function debugResponseFormat() {
  console.log('🔍 Debugging Bubble Response Format');
  console.log('===================================');

  try {
    const response = await fetch(`${BASE_URL}/wf/level`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`\nRaw response:`, responseText);

    try {
      const data = JSON.parse(responseText);
      console.log(`\nParsed data type:`, typeof data);
      console.log(`Is array:`, Array.isArray(data));

      if (Array.isArray(data)) {
        console.log(`Array length:`, data.length);
        if (data.length > 0) {
          console.log(`First item:`, JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log(`Object keys:`, Object.keys(data));
        console.log(`Full object:`, JSON.stringify(data, null, 2));
      }
    } catch (parseError) {
      console.log(`JSON parse error:`, parseError.message);
    }

  } catch (error) {
    console.error('Request error:', error.message);
  }
}

debugResponseFormat();