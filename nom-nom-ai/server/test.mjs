import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testCreateThread() {
  try {
    const response = await axios.post(`${BASE_URL}/thread`);
    console.log('Thread created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating thread:', error.response ? error.response.data : error.message);
  }
}

async function testSendMessage(threadId, message) {
  try {
    const response = await axios.post(`${BASE_URL}/chat`, { threadId, message });
    console.log('Received reply:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

async function main() {
  const { threadId } = await testCreateThread();
  if (threadId) {
    await testSendMessage(threadId, 'Hello, can you help me adjust my recipe?');
  }
}

main();