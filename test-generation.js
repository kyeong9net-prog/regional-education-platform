const fetch = require('node-fetch');

async function testGeneration() {
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        region: '서울',
        category: 'ALL',
        grade: 3,
        semester: 1,
        unit: 1,
      }),
    });

    const data = await response.json();
    console.log('Generation Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✓ Generation successful!');
      console.log('File URL:', data.fileUrl);
      console.log('Request ID:', data.requestId);
    } else {
      console.log('\n✗ Generation failed:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGeneration();
