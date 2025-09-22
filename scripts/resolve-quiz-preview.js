// Fetch a quiz and resolve its questions into UI-friendly shape
const API_KEY = process.env.EXPO_PUBLIC_BUBBLE_API_KEY || '2bcbbf27c42d9a0e78596d63b03fd1e2';
const BASE_URL = process.env.EXPO_PUBLIC_BUBBLE_BASE_URL || 'https://balangaai.bubbleapps.io/version-test/api/1.1';

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

async function getObj(type, id) {
  const data = await get(`/obj/${type}/${id}`);
  return data.response || data;
}

(async () => {
  try {
    const list = await get('/obj/quiz');
    const quizzes = list.response?.results || [];
    console.log('Quizzes count:', quizzes.length);
    if (quizzes.length === 0) return;

    const qz = quizzes[0];
    const lessonId = qz.lesson || qz.lesson_id;
    console.log('Quiz title:', qz.title);
    console.log('Lesson ID:', lessonId);

    const qIds = Array.isArray(qz.questions) ? qz.questions : [];
    console.log('Raw question IDs length:', qIds.length);

    const resolved = [];
    for (const id of qIds) {
      const q = await getObj('question', id);
      resolved.push({
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.map((o) => String(o).replace(/^\"|\"$/g, '')) : [],
        correct: typeof q.correct === 'number' ? q.correct : 0,
      });
    }

    console.log('Resolved questions length:', resolved.length);
    console.log('First resolved question:', resolved[0]);
  } catch (e) {
    console.error('Failed:', e.message);
  }
})();