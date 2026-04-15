async function testFlow() {
  const userId = 1; 
  const examId = 1; 

  console.log('--- TESTING EXAM FLOW (Native Fetch) ---');

  try {
    // 1. Start Exam
    console.log('1. Starting Exam...');
    const startRes = await fetch(`http://localhost:3001/api/exams/${examId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    console.log('Start Status:', startRes.status);
    console.log('Start Body:', await startRes.json());

    // 2. Save Progress
    console.log('2. Saving Progress...');
    const answers = { 1: 'A', 2: 'B' };
    await fetch(`http://localhost:3001/api/exams/${examId}/save-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    });

    // 3. Submit
    console.log('3. Submitting Exam...');
    const submitRes = await fetch(`http://localhost:3001/api/exams/${examId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    });
    console.log('Submit Body:', await submitRes.json());

  } catch (e) {
    console.error('Test Failed:', e.message);
  }
}

testFlow();
