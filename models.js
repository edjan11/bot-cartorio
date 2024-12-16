const axios = require('axios');

const apiKey = 'sk-svcacct-cEPggBSVPFH_2XBZNIraVRSwosJxfo2CPk5dQVEVuQ879QRTt2v78zG7TSAG9FJWiyhT3BlbkFJ68tG1bhA5B0rNTWe5_Y6_NG_8xLwWDeuo1otYq2fXgdk6m3YRHqTMpmFsmPAZNbSGawA'; 
const apiUrl = 'https://api.openai.com/v1/models';

async function askOpenAI(question) {
  try {
    const response = await axios.get(
      apiUrl,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`, 
        },
      }
    );

    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Example usage
askOpenAI('What are the office hours for Cartório 9º Ofício?');
