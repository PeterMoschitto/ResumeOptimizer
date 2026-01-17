require('dotenv').config();

// Test script to check provider configurations
async function testProviders() {
  console.log('Testing AI Provider Configurations...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test Google Gemini - List available models
  if (process.env.GOOGLE_API_KEY) {
    console.log('Testing Google Gemini API...');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Available Gemini Models:');
        data.models?.forEach(model => {
          if (model.name.includes('gemini')) {
            console.log(`  - ${model.name} (${model.supportedGenerationMethods?.join(', ') || 'N/A'})`);
          }
        });
      } else {
        const error = await response.json();
        console.log('❌ Error listing models:', error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    console.log('');
  }
  
  // Test Anthropic - Check API key validity
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('Testing Anthropic Claude API...');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Say "test"'
          }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Anthropic API working!');
        console.log('Response:', data.content[0].text);
      } else {
        const error = await response.json();
        console.log('❌ Anthropic Error:', error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    console.log('');
  }
}

testProviders().catch(console.error);
