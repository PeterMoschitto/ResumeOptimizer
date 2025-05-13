import 'dotenv/config';
export const testOpenAIKey = async () => {
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('❌ API key not found in .env file');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'API key is working!' if you can read this."
          }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ API key is working! Response:', data.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

// Run the test
testOpenAIKey(); 